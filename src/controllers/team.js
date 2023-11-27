const asyncErrorWrapper = require("express-async-handler");

const Team = require("../models/Team");

const CustomError = require("../helpers/models/CustomError");
const Respond = require("../helpers/models/Respond");

const { uploadImage } = require("../helpers/storage");

const create = asyncErrorWrapper(async (req, res, next) => {
    try {
        if (!Team.controlFields(req.body).success) return next(new CustomError(new Error("Invalid team"), 400, true));

        if (req.body.logo && typeof req.body.logo === "string" && req.body.logo !== "") {
            const response = await uploadImage(req.body.logo);
            if (!response.success) return next(response.data);
            req.body.logo = response.data;
        }

        const response = await Team.create(new Team(req.body));
        if (!response.success) return next(response.data);

        return res.status(201).json(new Respond(true, 201, response.data, "Team created successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const get = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError(new Error("Invalid id"), 400, true));

        const response = await Team.get({ id });
        if (!response.success) return next(response.data);

        if (!response.data) return next(new CustomError(new Error("Team not found"), 404, true));

        return res.status(200).json(new Respond(true, 200, response.data, "Team retrieved successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const remove = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError("Invalid id", 400, true));

        const response = await Team.remove({ id });
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "Team removed successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const update = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, name, shortName } = req.body;
        let { logo } = req.body;
        
        if (!id || typeof id !== "string") return next(new CustomError("Invalid id", 400, true));
        if (name && typeof name !== "string") return next(new CustomError("Invalid name", 400, true));
        if (shortName && typeof shortName !== "string") return next(new CustomError("Invalid shortName", 400, true));
        if (logo && typeof logo !== "string") return next(new CustomError("Invalid logo", 400, true));
        if (!name && !shortName && !logo) return next(new CustomError("No data provided", 400, true));

        const getResponse = await Team.get({ id });
        if (!getResponse.success) return next(getResponse.data);
        if (!getResponse.data) return next(new CustomError("Team not found", 404, true));

        if (logo) {
            const oldLogo = getResponse.data.logo;
            if (oldLogo && oldLogo !== "") {
                const deleteResponse = await deleteImage(oldLogo);
                if (!deleteResponse.success) return next(deleteResponse.data);
            }

            if (logo !== "") {
                const uploadResponse = await uploadImage(logo);
                if (!uploadResponse.success) return next(uploadResponse.data);
               
                logo = uploadResponse.data;
            }
        }

        const response = await Team.update({ id, name, shortName, logo });
        if (!response.success) return next(response.data);

        return res.status(200).json(new Respond(true, 200, {}, "Team updated successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    create,
    get,
    remove,
    update
};