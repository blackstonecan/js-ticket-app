const asyncErrorWrapper = require("express-async-handler");

const Category = require("../models/Category");

const CustomError = require("../helpers/models/CustomError");
const Respond = require("../helpers/models/Respond");

const update = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { categoryId, name, price, extraCapacity } = req.body;
        if (!categoryId) return next(new CustomError("Please provide valid inputs", 400));
        if (name && typeof name !== "string") return next(new CustomError("Please provide valid inputs", 400));
        if (price && typeof price !== "number") return next(new CustomError("Please provide valid inputs", 400));
        if (extraCapacity && typeof extraCapacity !== "number") return next(new CustomError("Please provide valid inputs", 400));

        let response;
        if (name || price) {
            response = await Category.update({ id: categoryId, name, price });
            if (!response.success) return next(response.data);
        }

        if (extraCapacity) {
            response = await Category.addTickets(categoryId, count);
            if (!response.success) return next(response.data);
        }

        const result = (extraCapacity) ? response.data : {};

        return res.status(200).json(new Respond(true, 200, result, "Category updated successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const addTickets = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { categoryId, count } = req.body;
        if (!categoryId || !count || typeof count !== "number") return next(new CustomError("Please provide valid inputs", 400));

        const response = await Category.addTickets(categoryId, count);
        if (!response.success) return next(response.data);

        return res.status(201).json(new Respond(true, 201, response.data, "Tickets added successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    update,
    addTickets
};
