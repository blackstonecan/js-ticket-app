const CustomError = require("../../helpers/models/CustomError");
const Respond = require("../../helpers/models/Respond");

const customErrorHandler = (err, req, res, next) => {
    const customError = err;

    if (process.env.NODE_ENV === "DEVELOPMENT") {
        console.log(customError.error.name);
        console.log(customError.error, customError.status);
    }
    res.status(customError.status)
        .json(new Respond(false, (customError.status), {}, customError.text));
};

module.exports = customErrorHandler;