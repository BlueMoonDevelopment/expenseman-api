import { Application } from 'express';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize';

import { authJwt } from '../middlewares/authJwt';
import { Account } from '../models/account.model';
import { account_settings } from '../config.json';

/**
 * @swagger
 * /accounts:
 *   get:
 *     tags:
 *     - "Account API"
 *     description: Brings up all Accounts for your user if no account_id is specified, or single account
 *     summary: Get accounts
 *     operationId: accounts__get
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             properties:
 *               account_id:
 *                 type: "string"
 *                 example: "63cdbc09a3adb6d82c13254a"
 *     responses:
 *       200:
 *         description: Successful Response
 *         content:
 *           application/json:
 *               schema:
 *                 type: "array"
 *                 items:
 *                   type: "object"
 *                   properties:
 *                     _id:
 *                       title: "Account ID"
 *                       type: "string"
 *                     account_owner_id:
 *                       title: "Owning user ID"
 *                       type: "string"
 *                     account_name:
 *                       title: "Account name"
 *                       type: "string"
 *                     account_currency:
 *                       title: "Account currency"
 *                       type: "string"
 *                     account_desc:
 *                       title: "Account description"
 *                       type: "string"
 *                     account_balance:
 *                       title: "Account balance"
 *                       type: "number"
 *                     __v:
 *                       title: "Account version"
 *                       type: "integer"
 *                 example:
 *                 - _id: "63cd6f99810a1500c067a70a"
 *                   account_owner_id: "63cd40b83391382af2ae71fb"
 *                   account_name: "Testaccount"
 *                   account_currency: "$"
 *                   account_desc: ""
 *                   account_balance: 0,
 *                   __v: 0
 *                 - _id: "63cd6fbf810a1500c067a70d"
 *                   account_owner_id: "63cd40b83391382af2ae71fb"
 *                   account_name: "Testaccount 2"
 *                   account_currency: "€"
 *                   account_desc: "This is the second test account"
 *                   account_balance: 100,
 *                   __v: 0
 *       401:
 *         description: "No token provided or token is wrong"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No token provided!"
 *       404:
 *         description: "Not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "Specified account_id not found."
 */
function registerGetAccountsFromUser(app: Application) {
    app.get('/accounts', authJwt.verifyToken, async (req, res) => {
        try {
            const user_id = mongoose.Types.ObjectId.createFromHexString(req.body.token_user_id);

            let accounts;

            if (req.body.account_id) {
                const account_id = mongoose.Types.ObjectId.createFromHexString(req.body.account_id);
                accounts = await Account.find({ account_owner_id: user_id, _id: account_id }).exec();
                if (accounts.length == 0) {
                    res.status(404).send({ message: 'Specified account_id not found.' });
                    return;
                }
            } else {
                accounts = await Account.find({ account_owner_id: user_id }).exec();
            }
            res.json(accounts);
        } catch (err) {
            res.status(500).send({ message: `Unknown error occured: ${err}` });
        }

    });
}

/**
 * @swagger
 * /accounts:
 *   post:
 *     tags:
 *     - "Account API"
 *     summary: "Create new account"
 *     description: "Create a new account"
 *     operationId: "accounts__post"
 *     consumes:
 *     - "application/json"
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *             - account_name
 *             properties:
 *               account_name:
 *                 type: "string"
 *                 example: "My income"
 *               account_currency:
 *                 type: "string"
 *                 example: "$"
 *               account_desc:
 *                 type: "string"
 *                 example: "universal bank"
 *               account_balance:
 *                 type: "number"
 *                 example: 1134
 *     responses:
 *       200:
 *         description: "Successful response"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Confirmation message"
 *                   type: "string"
 *             example:
 *               message: "Account creation was successful"
 *       401:
 *         description: "No token provided or token is wrong"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No token provided!"
 *       409:
 *         description: "Limit reached"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "Account limit reached!"
 *       400:
 *         description: "No account name provided"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No account name was provided."
 */
function registerCreateAccount(app: Application) {
    app.post('/accounts', authJwt.verifyToken, async (req, res, next) => {
        const user_id = mongoose.Types.ObjectId.createFromHexString(req.body.token_user_id);
        const limit = account_settings.account_limit;
        const accounts = await Account.find({ account_owner_id: user_id }).exec();

        if (accounts.length == limit) {
            res.status(409).send({ message: 'Account limit reached!' });
            return;
        }

        if (!req.body.account_name) {
            res.status(400).send({ message: 'No account name was provided.' });
            return;
        }

        const data = {
            account_owner_id: user_id,
            account_name: sanitize(req.body.account_name),
            account_currency: sanitize(req.body.account_currency),
            account_desc: sanitize(req.body.account_desc),
            account_balance: sanitize(req.body.account_balance),
        };

        await Account.create(data, function (err: mongoose.CallbackError) {
            if (err) return next(err);
            res.status(200).send({ message: 'Account creation was successful' });
        });
    });
}

/**
 * @swagger
 * /accounts:
 *   delete:
 *     tags:
 *     - "Account API"
 *     summary: "Delete an account"
 *     description: "Delete an account"
 *     operationId: "accounts__delete"
 *     consumes:
 *     - "application/json"
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *             - account_id
 *             properties:
 *               account_id:
 *                 type: "string"
 *                 example: "f343dfgj435jkgfn34dfdgdf"
 *     responses:
 *       200:
 *         description: "Successful response"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Confirmation message"
 *                   type: "string"
 *             example:
 *               message: "Account deleted successfully"
 *       401:
 *         description: "No token provided or token is wrong"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No token provided!"
 *       404:
 *         description: "Not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No matching account was found for your user."
 */
function registerDeleteAccount(app: Application) {
    app.delete('/accounts', authJwt.verifyToken, function (req, res, next) {
        const user_id = mongoose.Types.ObjectId.createFromHexString(req.body.token_user_id);
        const account_id = mongoose.Types.ObjectId.createFromHexString(req.body.account_id);

        Account.findOneAndRemove({
            _id: account_id,
            account_owner_id: user_id,
        }, (err: mongoose.CallbackError, result: mongoose.Document) => {
            if (err) return next(err);

            if (!result) {
                res.status(404).send({ message: 'No matching account was found for your user.' });
            } else {
                res.status(200).send({ message: 'Account deleted successfully' });
            }
        });
    });
}

/**
 * @swagger
 * /accounts:
 *   put:
 *     tags:
 *     - "Account API"
 *     summary: "Update an account"
 *     description: "Update an account for your user, account_id is required, everything else is optional."
 *     operationId: "accounts__put"
 *     consumes:
 *     - "application/json"
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *             - account_id
 *             properties:
 *               account_id:
 *                 type: "string"
 *                 example: "63cdbc09a3adb6d82c13254a"
 *               account_name:
 *                 type: "string"
 *                 example: "My income"
 *               account_currency:
 *                 type: "string"
 *                 example: "$"
 *               account_desc:
 *                 type: "string"
 *                 example: "universal bank"
 *               account_balance:
 *                 type: "number"
 *                 example: 1134
 *     responses:
 *       200:
 *         description: "Successful response"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Confirmation message"
 *                   type: "string"
 *             example:
 *               message: "Account modified successfully"
 *       401:
 *         description: "No token provided or token is wrong"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No token provided!"
 *       404:
 *         description: "Not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   title: "Error message"
 *                   type: "string"
 *             example:
 *               message: "No matching account was found for your user."
 */
function registerUpdateAccount(app: Application) {
    app.put('/accounts', authJwt.verifyToken, function (req, res, next) {
        const user_id = mongoose.Types.ObjectId.createFromHexString(req.body.token_user_id);
        const account_id = mongoose.Types.ObjectId.createFromHexString(req.body.account_id);

        const data = {
            account_name: sanitize(req.body.account_name),
            account_currency: sanitize(req.body.account_currency),
            account_desc: sanitize(req.body.account_desc),
            account_balance: sanitize(req.body.account_balance),
        };

        Account.findOneAndUpdate({
            _id: account_id,
            account_owner_id: user_id,
        }, data, (err: mongoose.CallbackError, result: mongoose.Document) => {
            if (err) return next(err);

            if (!result) {
                res.status(404).send({ message: 'No matching account was found for your user.' });
            } else {
                res.status(200).send({ message: 'Account updated successfully' });
            }
        });
    });
}

export function registerAccountRoutes(app: Application) {
    registerGetAccountsFromUser(app);
    registerCreateAccount(app);
    registerDeleteAccount(app);
    registerUpdateAccount(app);
}