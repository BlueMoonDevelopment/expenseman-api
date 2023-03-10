import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sanitize from 'mongo-sanitize';

import { User } from '../models/user.model';
import { jwt_secret } from '../config.json';
import { Request, Response } from 'express';

export const checkUser = (req: Request, res: Response) => {
    User.findOne({ email: sanitize(req.body.email) }).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(200).send({ exists: false });
        } else {
            return res.status(200).send({
                exists: true,
                _id: user._id,
            });
        }
    });
};

export const checkToken = (req: Request, res: Response) => {
    const id = sanitize(req.body.id);
    const tok = sanitize(req.body.accessToken);

    User.findById(id).exec((err, user) => {
        if (err) {
            res.status(200).send({ matching: false });
            return;
        }

        if (user && jwt.verify(tok, jwt_secret)) {
            res.status(200).send({ matching: true });
        } else {
            res.status(200).send({ matching: false });
        }
    });
};

export const signup = (req: Request, res: Response) => {
    const user = new User({
        email: sanitize(req.body.email),
        password: bcrypt.hashSync(sanitize(req.body.password), 8),
    });

    user.save((err) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        const token = jwt.sign({ id: user.id }, jwt_secret, {
            // 24 hours
            expiresIn: 86400,
        });
        res.status(200).send({ accessToken: token, id: user.id });
    });
};

export const signin = (req: Request, res: Response) => {
    User.findOne({
        email: sanitize(req.body.email),
    })
        .exec((err, user) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            if (!user || !user.password) {
                return res.status(404).send({ message: 'User Not found.' });
            }

            const passwordIsValid = bcrypt.compareSync(
                sanitize(req.body.password),
                user.password,
            );

            if (!passwordIsValid) {
                return res.status(401).send({
                    message: 'Invalid Password!',
                });
            }

            const token = jwt.sign({ id: user.id }, jwt_secret, {
                // 24 hours
                expiresIn: 86400,
            });

            res.status(200).send({
                id: user._id,
                email: user.email,
                accessToken: token,
            });
        });
};