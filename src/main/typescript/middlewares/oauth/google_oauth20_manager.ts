import { Application } from 'express';
import { jwtDecode } from 'jwt-decode';
import jwt from 'jsonwebtoken';

import { User } from '../../models/user.model';
import { server_settings, security_settings } from '../../../json/config.json';
import { debug } from '../../tools/logmanager';

export function register_google_oauth_20_routes(app: Application) {
    // Either sign-in or sign-up and then sign-in
    app.post('/auth/google', async (req, res) => {
        const credential = req.body.credential;

        debug('credential: ' + credential);

        if (credential === undefined) {
            return res.redirect(server_settings.frontend_url + '/auth/failed');
        }

        const USER_DATA = jwtDecode(credential);

        let user = await User.findOne({ email: USER_DATA.email, sub: USER_DATA.sub }).exec();
        if (!user) {
            console.log('user not found, registering new one!');
            // Register new user
            user = new User({
                email: USER_DATA.email,
                sub: USER_DATA.sub,
            });
            user.save();
        }


        const token = jwt.sign({ id: user.id }, security_settings.jwt_secret, {
            // 24 hours
            expiresIn: security_settings.session_expires_in_seconds,
        });
        req.session.userId = user._id as string;
        req.session.accessToken = token;
        req.session.save();
        return res.redirect(server_settings.frontend_url + '/app');
    });

    app.get('/auth/google', (req, res) => {
        return res.status(403).json({ 'message': 'no direct access!' });
    });
}
