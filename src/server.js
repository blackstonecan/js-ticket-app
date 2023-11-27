const express = require("express");
const cors = require("cors");
const asyncErrorWrapper = require("express-async-handler");
require('dotenv').config()

const customErrorHandler = require("./middlewares/errors/customErrorHandler");
const routers = require("./routers/index");

const { checkAndCreateCollections } = require("./helpers/db");

const app = express();

//Express Body Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Enable CORS
app.use(cors());

const PORT = process.env.PORT;

// Routers Middleware
app.use("/", routers);

//Error Handler
app.use(customErrorHandler);

app.listen(PORT, asyncErrorWrapper(async () => {
    try {
        const response = await checkAndCreateCollections();
        if (!response.success) throw response.data;
        
        console.log(`App started on ${PORT} : ${process.env.NODE_ENV}`);
    } catch (error) {
        console.log(error);
    }
}));