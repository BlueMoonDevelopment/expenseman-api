import { authJwt } from '../authJwt';
import { debug } from '../../tools/logmanager';
import { Application } from 'express';

export function register_general_oauth_routes(app: Application) {
    app.get('/auth/checksignedin', authJwt.verifyToken, (req, res) => {
        debug('user is signed in');
        return res.status(200).send();
    });
}