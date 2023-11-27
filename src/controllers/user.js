const asyncErrorWrapper = require("express-async-handler");

const User = require("../models/User");

const CustomError = require("../helpers/models/CustomError");
const Respond = require("../helpers/models/Respond");

const create = asyncErrorWrapper(async (req, res, next) => {
    try {
        if (!User.controlFields(req.body).success) return next(new CustomError(new Error("Invalid user"), 400, true));

        const response = await User.create(new User(req.body));
        if (!response.success) return next(response.data);

        return res.status(201).json(new Respond(true, 201, response.data, "User created successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const get = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, userId } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError(new Error("Invalid id"), 400, true));
        if (id !== userId) return next(new CustomError(new Error("Permission denied."), 403, true));

        const response = await User.get({ id });
        if (!response.success) return next(response.data);

        if (!response.data) return next(new CustomError(new Error("User not found"), 404, true));

        return res.status(200).json(new Respond(true, 200, response.data, "User retrieved successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const remove = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, userId } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError("Invalid id", 400, true));
        if (id !== userId) return next(new CustomError(new Error("Permission denied."), 403, true));

        const response = await User.remove({ id });
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "User removed successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const buyTicket = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { userId, ticketId } = req.body;
        const tokenUserId = req.params.userId;
        if (!userId || typeof userId !== "string") return next(new CustomError("Invalid userId", 400, true));
        if (userId !== tokenUserId) return next(new CustomError(new Error("Permission denied."), 403, true));

        if (!ticketId || typeof ticketId !== "string") return next(new CustomError("Invalid ticketId", 400, true));

        const response = await User.buy(userId, ticketId);
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "Ticket bought successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const sellTicket = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { userId, ticketId } = req.body;
        const tokenUserId = req.params.userId;
        if (!userId || typeof userId !== "string") return next(new CustomError("Invalid userId", 400, true));
        if (userId !== tokenUserId) return next(new CustomError(new Error("Permission denied."), 403, true));

        if (!ticketId || typeof ticketId !== "string") return next(new CustomError("Invalid ticketId", 400, true));

        const response = await User.sell(userId, ticketId);
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "Ticket sold successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    create,
    get,
    remove,
    buyTicket,
    sellTicket
};