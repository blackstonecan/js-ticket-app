const asyncErrorWrapper = require("express-async-handler");
const md5 = require('md5');

const User = require("../../models/User");
const Admin = require("../../models/Admin");

const Response = require("../../helpers/models/Response");
const CustomError = require("../../helpers/models/CustomError");

const { verifyJWT } = require("../../helpers/auth");

const headerControl = (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res;
}

const getTokenFromHeader = (req) => {
    const authorization = req.headers.authorization;
    let token;

    if (authorization && authorization.startsWith("Bearer")) token = authorization.split(" ")[1];
    else return Response(false, new CustomError(new Error("Token parameter is missing."), 401, true));

    return new Response(true, token);
}

const controlMD5 = asyncErrorWrapper(async (req, res, next) => {
    try {
        res = headerControl(res);
        let APP_SECRET_KEY = process.env.APP_SECRET_KEY;
        let { nonce, timestamp, signature } = req.headers;

        if (!nonce || !timestamp || !signature) return next(new CustomError(new Error("Header parameters are missing."), 401, true));

        let fullString = APP_SECRET_KEY + "&" + nonce + "&" + timestamp;
        let hashedString = md5(fullString);

        if (hashedString != signature) return next(new CustomError(new Error("Permission denied."), 403, true));

        next();
    } catch (error) {
        return next(new CustomError(error, 500, false, "Permission denied."));
    }
});

const controlUserToken = asyncErrorWrapper(async (req, res, next) => {
    try {
        const tokenResponse = getTokenFromHeader(req);
        if (!tokenResponse.success) return next(tokenResponse.data);

        const token = tokenResponse.data;

        const [header, payload, signature] = token.split(".");
        if (!header || !payload || !signature) return next(new CustomError(new Error("Token is invalid."), 401, true));

        const decodedPayload = Buffer.from(payload, "base64").toString();
        const { id } = JSON.parse(decodedPayload);

        const verifyResponse = verifyJWT(token);
        if (!verifyResponse.success) {
            const userResponse = await User.controlToken(id, token);
            if (!userResponse.success) return next(new CustomError(verifyResponse.data.error, 500, false, "Permission denied."));

            return next(new CustomError(new Error("Token is expired. Please login again."), 403, true));
        }

        req.params.userId = verifyResponse.data.id;

        next();
    } catch (error) {
        return next(new CustomError(error, 500, false, "Permission denied."));
    }
});

const controlAdminToken = asyncErrorWrapper(async (req, res, next) => {
    try {
        const tokenResponse = getTokenFromHeader(req);
        if (!tokenResponse.success) return next(tokenResponse.data);

        const token = tokenResponse.data;

        const [header, payload, signature] = token.split(".");
        if (!header || !payload || !signature) return next(new CustomError(new Error("Token is invalid."), 401, true));

        const decodedPayload = Buffer.from(payload, "base64").toString();
        const { id } = JSON.parse(decodedPayload);

        const verifyResponse = verifyJWT(token);
        if (!verifyResponse.success) {
            const adminResponse = await Admin.controlToken(id, token);
            if (!adminResponse.success) return next(new CustomError(verifyResponse.data.error, 500, false, "Permission denied."));

            return next(new CustomError(new Error("Token is expired. Please login again."), 403, true));
        }

        req.params.adminId = verifyResponse.data.id;

        next();
    } catch (error) {
        return next(new CustomError(error, 500, false, "Permission denied."));
    }
});

module.exports = {
    controlMD5,
    controlUserToken,
    controlAdminToken
};

