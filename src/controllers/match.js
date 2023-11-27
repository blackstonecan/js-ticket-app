const asyncErrorWrapper = require("express-async-handler");

const Team = require("../models/Team");
const Match = require("../models/Match");
const Category = require("../models/Category");
const Ticket = require("../models/Ticket");

const Respond = require("../helpers/models/Respond");
const CustomError = require("../helpers/models/CustomError");

const create = asyncErrorWrapper(async (req, res, next) => {
    try {
        let { teams, date, stadium, categories } = req.body;
        if (!teams || !Array.isArray(teams)) return next(new CustomError(new Error("Invalid teams"), 400, true));
        if (!date || typeof date !== "string") return next(new CustomError(new Error("Invalid date"), 400, true));
        if (!stadium || typeof stadium !== "string") return next(new CustomError(new Error("Invalid stadium"), 400, true));
        if (!categories || !Array.isArray(categories)) return next(new CustomError(new Error("Invalid categories"), 400, true));

        for (let i = 0; i < categories.length; i++) {
            let element = categories[i];
            if (!Category.controlFields(element).success) return next(new CustomError(new Error("Invalid category"), 400, true));

            const ticketResponse = await Ticket.createMany(Ticket.generateTickets(element.capacity));
            if (!ticketResponse.success) return next(ticketResponse.data);

            element.tickets = ticketResponse.data;
            categories[i] = new Category(element);
        }

        const categoryResponse = await Category.createMany(categories);
        if (!categoryResponse.success) return next(categoryResponse.data);

        let match = {
            teams,
            date,
            stadium,
            categories: categoryResponse.data
        };
        if (!Match.controlFields(match).success) return next(new CustomError(new Error("Invalid match"), 400, true));

        const matchResponse = await Match.create(new Match(match));
        if (!matchResponse.success) return next(matchResponse.data);

        for (let i = 0; i < categories.length; i++) {
            let element = categories[i];
            element = {
                name: element.name,
                id: categoryResponse.data[i]
            };
            categories[i] = element;
        }

        const result = {
            match: matchResponse.data,
            categories
        }

        return res.status(201).json(new Respond(true, 201, result, "Match created successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const get = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== "string") return next(new CustomError(new Error("Invalid match id"), 400, true));

        const matchResponse = await Match.get(id);
        if (!matchResponse.success) return next(matchResponse.data);

        const teamResponse = await Team.getMany({ ids: matchResponse.data.teams });
        if (!teamResponse.success) return next(teamResponse.data);

        const categoryResponse = await Category.getMany({ ids: matchResponse.data.categories });
        if (!categoryResponse.success) return next(categoryResponse.data);

        const result = {
            date: matchResponse.data.date,
            stadium: matchResponse.data.stadium,
            teams: teamResponse.data,
            categories: categoryResponse.data
        }

        return res.status(200).json(new Respond(true, 200, result, "Match retrieved successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const getAll = asyncErrorWrapper(async (req, res, next) => {
    try {
        const matchResponse = await Match.getAll();
        if (!matchResponse.success) return next(matchResponse.data);

        let result = [];

        for (const match of matchResponse.data) {
            const teamResponse = await Team.getMany({ ids: match.teams });
            if (!teamResponse.success) return next(teamResponse.data);

            const categoryResponse = await Category.getMany({ ids: match.categories });
            if (!categoryResponse.success) return next(categoryResponse.data);

            result.push({
                _id: match._id,
                date: match.date,
                stadium: match.stadium,
                teams: teamResponse.data,
                categories: categoryResponse.data.map(category => {
                    category.tickets = (category.tickets || []).map(ticket => {
                        delete ticket.user;
                        return ticket;
                    });
                    return category;
                })
            });
        }

        return res.status(200).json(new Respond(true, 200, result, "Matches retrieved successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const update = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id, date, stadium } = req.body;
        if (!id || typeof id !== "string") return next(new CustomError(new Error("Invalid match id"), 400, true));
        if (date && typeof date !== "string") return next(new CustomError(new Error("Invalid date"), 400, true));
        if (stadium && typeof stadium !== "string") return next(new CustomError(new Error("Invalid stadium"), 400, true));
        if(!date && !stadium) return next(new CustomError(new Error("Invalid update"), 400, true));

        const matchResponse = await Match.update({id, date, stadium});
        if (!matchResponse.success) return next(matchResponse.data);

        return res.status(200).json(new Respond(true, 200, null, "Match updated successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

const addCategory = asyncErrorWrapper(async (req, res, next) => {
    try {
        let { matchId, category } = req.body;
        if (!matchId || typeof matchId !== "string") return next(new CustomError(new Error("Invalid match id"), 400, true));
        if (!category || typeof category !== "object") return next(new CustomError(new Error("Invalid category"), 400, true));
        if (!Category.controlFields(category).success) return next(new CustomError(new Error("Invalid category"), 400, true));

        let tickets = Ticket.generateTickets(category.capacity);
        const ticketResponse = await Ticket.createMany(tickets);
        if (!ticketResponse.success) return next(ticketResponse.data);

        category.tickets = ticketResponse.data;

        const categoryResponse = await Category.create(new Category(category));
        if (!categoryResponse.success) return next(categoryResponse.data);

        const matchResponse = await Match.addCategory(matchId, categoryResponse.data);
        if (!matchResponse.success) return next(matchResponse.data);

        for (let i = 0; i < tickets.length; i++) {
            tickets[i]._id = category.tickets[i];
            tickets[i].user = null;
        }

        category.tickets = tickets;
        category._id = categoryResponse.data;

        return res.status(200).json(new Respond(true, 200, category, "Category added successfully"));
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

module.exports = {
    create,
    get,
    update,
    addCategory,
    getAll
};