const asyncErrorWrapper = require("express-async-handler");

const Admin = require("../models/Admin");

const Respond = require("../helpers/models/Respond");
const CustomError = require("../helpers/models/CustomError");

const { hash, createJWT, verifyJWT } = require("../helpers/auth");

const create = asyncErrorWrapper(async (req, res, next) => {
    try {
        if (!Admin.controlFields(req.body).success) return next(new CustomError(new Error("Invalid admin"), 400, true));

        const response = await Admin.create(new Admin(req.body));
        if (!response.success) return next(response.data);

        return res.status(201).json(new Respond(true, 201, response.data, "Admin created successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const get = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, adminId } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError(new Error("Invalid id"), 400, true));
        if (id !== adminId) return next(new CustomError(new Error("Permission denied."), 403, true));

        const response = await Admin.get({ id });
        if (!response.success) return next(response.data);

        if (!response.data) return next(new CustomError(new Error("Admin not found"), 404, true));

        return res.status(200).json(new Respond(true, 200, response.data, "Admin retrieved successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const remove = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, adminId } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError("Invalid id", 400, true));
        if (id !== adminId) return next(new CustomError(new Error("Permission denied."), 403, true));

        const response = await Admin.remove({ id });
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "Admin removed successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const login = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== "string") return next(new CustomError(new Error("Invalid email"), 401, true));
        if (!password || typeof password !== "string") return next(new CustomError(new Error("Invalid password"), 401, true));

        const response = await Admin.get({ email });
        if (!response.success) return next(response.data);
        if (!response.data) return next(new CustomError(new Error("Admin not found"), 404, true));

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

        return res.status(200).json(new Respond(true, 200, token, "Admin logged in successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    create,
    get,
    remove,
    login
};