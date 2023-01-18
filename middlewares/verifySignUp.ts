import { NextFunction, Request, Response } from 'express';
import { User } from '../models/user.model';

const checkDuplicateEmail = (req: Request, res: Response, next: NextFunction) => {
    // Email
    User.findOne({
        email: req.body.email,
    }).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (user) {
            res.status(400).send({ message: 'Failed! Email is already in use!' });
            return;
        }

        next();
    });
};

export const verifySignUp = {
    checkDuplicateEmail,
};