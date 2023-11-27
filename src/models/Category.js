const { Double } = require("mongodb");

const useDB = require("../helpers/db/useDB");

const Model = require("./Model");
const Ticket = require("./Ticket");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { dictToObjectId, stringToObjectId } = require("../helpers");


class Category extends Model {
    static cName = 'categories';

    constructor({ name, price, capacity, tickets, _id }) {
        super(_id);
        this.name = name;
        this.price = price;
        this.capacity = capacity;
        this.tickets = tickets;
    }

    static async createCollection() {
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(Category.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "Category object schema",
                            required: ["name", "price", "capacity"],
                            properties: {
                                name: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                price: {
                                    bsonType: "double",
                                    description: "must be a double"
                                },
                                capacity: {
                                    bsonType: "int",
                                    description: "must be an integer"
                                },
                                tickets: {
                                    bsonType: "array",
                                    description: "must be an array of ticket ids",
                                    items: {
                                        bsonType: "objectId"
                                    },
                                    minItems: 1,
                                    uniqueItems: true
                                }
                            }
                        }
                    }
                });
            });
            if (!response.success) return response;
            return new Response(true, null);
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static controlFields(category) {
        let control = true;

        if (!category.name || typeof category.name !== 'string') control = false;
        if (!category.price || typeof category.price !== 'number') control = false;
        if (!category.capacity || typeof category.capacity !== 'number') control = false;
        if (category.tickets && !Array.isArray(category.tickets)) control = false;

        return new Response(control, null);
    }

    static async create(category) {
        try {
            let response = await useDB(async (db) => {
                try {
                    const response = await db.collection(Category.cName).insertOne(category);
                    if (!response.insertedId) return new Response(false, new CustomError(new Error("Category could not be created"), 500, true));

                    return new Response(true, response.insertedId);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            if (!response.success) return response;
            return new Response(true, response.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async createMany(categories) {
        try {
            if ((new Set([...categories.map(category => category.name)])).size !== categories.length) return new Response(false, new CustomError(new Error("Categories must have unique names"), 400, true));

            let response = await useDB(async (db) => {
                try {
                    const result = await db.collection(Category.cName).insertMany(categories);

                    if (result.insertedCount) {
                        return new Response(true, dictToObjectId(result.insertedIds));
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create categories'), 500, true));
                    }
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            if (!response.success) return response;
            return new Response(true, response.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async getMany({ ids }) {
        try {
            if (!Array.isArray(ids)) return new Response(false, new CustomError(new Error("Invalid category ids"), 400, true));
            ids = stringToObjectId(ids);

            let response = await useDB(async (db) => {
                
                try {
                    let result = await db.collection(Category.cName).aggregate([
                        {
                            $match: {
                                _id: {
                                    $in: ids
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: Ticket.cName,
                                localField: 'tickets',
                                foreignField: '_id',
                                as: 'ticketDetails'
                            }
                        }
                    ]).toArray();

                    result = result.map((category) => {
                        category.tickets = category.ticketDetails.map((ticket) => new Ticket(ticket));
                        delete category.ticketDetails;
                        return new Category(category);
                    });

                    return new Response(true, result);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            if (!response.success) return response;
            return new Response(true, response.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async get({ id }) {
        try {
            if (!id) return new Response(false, new CustomError(new Error('Invalid category id'), 400, true));
            id = stringToObjectId([id])[0];

            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Category.cName).aggregate([
                        {
                            $match: {
                                _id: id
                            }
                        },
                        {
                            $lookup: {
                                from: Ticket.cName,
                                localField: 'tickets',
                                foreignField: '_id',
                                as: 'ticketDetails'
                            }
                        }
                    ]).toArray();

                    if (result.length) {
                        result = result[0];
                        result.tickets = result.ticketDetails.map((ticket) => new Ticket(ticket));
                        delete result.ticketDetails;
                        result = new Category(result);
                    } else result = null;

                    return new Response(true, result);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            if (!response.success) return response;
            return new Response(true, response.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async addTickets(categoryId, ticketCount) {
        try {
            if (!categoryId) return new Response(false, new CustomError(new Error('Invalid category id'), 400, true));
            if (!ticketCount || typeof ticketCount !== 'number') return new Response(false, new CustomError(new Error('Invalid ticket count'), 400, true));

            categoryId = stringToObjectId([categoryId])[0];

            const response = await useDB(async (db) => {
                try {
                    const category = await db.collection(Category.cName).findOne({ _id: categoryId });
                    if (!category) return new Response(false, new CustomError(new Error('Category not found'), 404, true));

                    const tickets = Ticket.generateTickets(ticketCount, category.capacity);
                    const ticketResponse = await Ticket.createMany(tickets);
                    if (!ticketResponse.success) return ticketResponse;

                    const newCapacity = category.capacity + ticketCount;

                    const update = await db.collection(Category.cName).updateOne({ _id: categoryId }, { $set: { capacity: newCapacity }, $addToSet: { tickets: { $each: result.data } } });
                    if (!update.modifiedCount) return new Response(false, new CustomError(new Error('Failed to add tickets to category'), 500, true));

                    const result = {
                        capacity: newCapacity,
                        tickets: tickets.map((ticket, index) => {
                            ticket._id = ticketResponse.data[index];
                            return ticket;
                        })
                    };

                    return new Response(true, result);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });

            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async update({ id, name, price }) {
        try {
            if (!id) return new Response(false, new CustomError(new Error('Invalid category id'), 400, true));
            id = stringToObjectId([id])[0];

            let response = await useDB(async (db) => {
                try {
                    let category = await db.collection(Category.cName).findOne({ _id: id });
                    if (!category) return new Response(false, new CustomError(new Error('Category not found'), 404, true));

                    let update = {};
                    if (name) update.name = name;
                    if (price) update.price = new Double(price);

                    let result = await db.collection(Category.cName).updateOne({ _id: id }, { $set: update });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to update category'), 500, true));

                    return new Response(true, null);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });

            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }

    static async getByTicket(ticketId) {
        try {
            if (!ticketId) return new Response(false, new CustomError(new Error('Invalid ticket id'), 400, true));
            ticketId = stringToObjectId([ticketId])[0];

            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Category.cName).findOne({ tickets: ticketId });
                    if(!result) return new Response(false, new CustomError(new Error('Category not found'), 404, true));
                    
                    result = new Category(result);

                    return new Response(true, result);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            if (!response.success) return response;
            return new Response(true, response.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500));
        }
    }
}

module.exports = Category;