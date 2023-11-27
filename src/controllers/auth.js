const asyncErrorWrapper = require("express-async-handler");

const User = require("../models/User");

const Respond = require("../helpers/models/Respond");
const CustomError = require("../helpers/models/CustomError");

const { hash, createJWT, verifyJWT } = require("../helpers/auth");

const login = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== "string") return next(new CustomError(new Error("Invalid email"), 401, true));
        if (!password || typeof password !== "string") return next(new CustomError(new Error("Invalid password"), 401, true));

        const response = await User.get({ email });
        if (!response.success) return next(response.data);
        if (!response.data) return next(new CustomError(new Error("User not found"), 404, true));

        const hashedPassword = hash(password);
        if (hashedPassword !== response.data.password) return next(new CustomError(new Error("Incorrect password"), 403, true));

        let token;
        if (response.data.token && response.data.token !== "") {
            const verifyResponse = verifyJWT(response.data.token);
            if (verifyResponse.success) token = response.data.token;
        }
        if (!token) {
            const jwt = createJWT(response.data._id);
            if (!jwt.success) return next(jwt.data);

            token = jwt.data;
        }


        return res.status(200).json(new Respond(true, 200, token, "User logged in successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const isLogged = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { token, userId } = req.body;
        if (!token || typeof token !== "string") return next(new CustomError(new Error("Invalid token"), 401, true));
        if (!userId || typeof userId !== "string") return next(new CustomError(new Error("Invalid userId"), 401, true));

        const [header, payload, signature] = token.split(".");
        if (!header || !payload || !signature) return next(new CustomError(new Error("Token is invalid."), 401, true));

        const decodedPayload = Buffer.from(payload, "base64").toString();
        const { id } = JSON.parse(decodedPayload);

        if (id !== userId) return next(new CustomError(new Error("Permission denied."), 403, true));

        let result = null;

        const verifyResponse = verifyJWT(token);
        if (!verifyResponse.success) {
            const userResponse = await User.controlToken(id, token);
            if (!userResponse.success) return next(new CustomError(verifyResponse.data.error, 500, false, "Permission denied."));

            const createResponse = createJWT(id);
            if (!createResponse.success) return next(createResponse.data);

            result = createResponse.data;
        }

        return res.status(200).json(new Respond(true, 200, result, "User is logged in"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    login,
    isLogged
};