const useDB = require("./useDB");

const User = require("../../models/User");
const Admin = require("../../models/Admin");
const Team = require("../../models/Team");
const Ticket = require("../../models/Ticket");
const Match = require("../../models/Match");
const Category = require("../../models/Category");

const Response = require("../models/Response");
const CustomError = require("../models/CustomError");

const models = [User, Admin, Team, Ticket, Match, Category];

const checkAndCreateCollections = async () => {
    try {
        let response = await useDB(async (db) => {
            for (let model of models) {
                const collectionInfo = await db.listCollections({ name: model.cName }).next();
                if (!collectionInfo) await model.createCollection();
            }
        });
        if (!response.success) return response;
        return new Response(true, null);
    } catch (error) {
        return new Response(true, new CustomError(error, 500));
    }
}

module.exports = {
    checkAndCreateCollections
}