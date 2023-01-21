/**
 * Required external modules
 */
import express, { Application } from 'express';
import session from 'express-session';
import ratelimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

/**
 * Required internal modules
 */
import { info, errorWithError } from './logmanager';
import { registerSwaggerUI } from './swaggerhelper';

/**
 * Required routes
 */
import { registerUserRoutes } from './routes/user.routes';
import { registerAuthRoutes } from './routes/auth.routes';
import { registerProductRoutes } from './routes/products.routes';

/**
 * Required configuration sections
 */
import { website_port, session_secret, mongodb_auth_url } from './config.json';

/**
 * App Variables
 */
const app: Application = express();

/**
 * Database connection
 */
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);
mongoose.connect(mongodb_auth_url, { keepAlive: true, keepAliveInitialDelay: 300000 }).then(() => info('Connected to mongodb')).catch((err) => errorWithError('Error connecting to mongodb', err));

/**
 * App Configuration
 */
app.disable('x-powered-by');
app.use(express.json());
app.use(helmet());
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(ratelimit({ windowMs: 60 * 1000, max: 60 }));
app.use(express.static(__dirname + '/public'));
app.set('trust proxy', true);
app.set('view engine', 'ejs');

/**
 * Session Configuration
 */
app.use(session({
  secret: session_secret,
  saveUninitialized: false,
  cookie: { maxAge: 60000 },
  resave: false,
}));

// Setup header too allow access-token
app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

/**
 * Route definitions
 */
registerProductRoutes(app);
registerAuthRoutes(app);
registerUserRoutes(app);

registerSwaggerUI(app);

// 404 Error, has to be called last (after all other pages)
app.use(function (req, res) {
  res.status(404).send('404 Not found');
});


/**
 * Server Activation
 */
app.listen(website_port, () => {
  info(`Listening to requests at 127.0.0.1:${website_port}`);
});