const md5 = require('md5');
const jwt = require('jsonwebtoken');

const Response = require('../models/Response');
const CustomError = require('../models/CustomError');

const hash = (text) => {
    return md5(text);
}

const createJWT = (id) => {
    try {
        const token = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRE
        });

        return new Response(true, token);
    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

const verifyJWT = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return new Response(true, decoded);
    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

module.exports = {
    hash,
    createJWT,
    verifyJWT
};