const { Double, ObjectId } = require("mongodb");

const useDB = require("../helpers/db/useDB");

const Model = require("./Model");
const Category = require("./Category");
const Ticket = require("./Ticket");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { stringToObjectId } = require("../helpers");
const { hash } = require("../helpers/auth");


class User extends Model {
    static cName = 'users';

    constructor({ firstName, lastName, email, password, budget, token, _id }) {
        super(_id);
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        if (token) this.token = token;
        this.budget = budget || null;
    }

    static async createCollection() {
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(User.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "User object schema",
                            required: ["firstName", "lastName", "email", "password"],
                            properties: {
                                firstName: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                lastName: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                email: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                password: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                token: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                budget: {
                                    bsonType: "double",
                                    description: "must be a double"
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

    static controlFields(user) {
        let control = true;

        if (!user.firstName || typeof user.firstName !== 'string') control = false;
        if (!user.lastName || typeof user.lastName !== 'string') control = false;
        if (!user.email || typeof user.email !== 'string') control = false;
        if (!user.password || typeof user.password !== 'string') control = false;
        if (user.budget && typeof user.budget !== 'number') control = false;

        return new Response(control, null);
    }

    static async create(user) {
        try {
            let response = await useDB(async (db) => {
                try {
                    const existingUser = await db.collection(User.cName).findOne({ email: user.email });
                    if (existingUser) return new Response(false, new CustomError(new Error('User email already exists'), 400, true));

                    user.password = hash(user.password);
                    if (!user.budget) delete user.budget;
                    else user.budget = new Double(user.budget);

                    const result = await db.collection(User.cName).insertOne(user);

                    if (result.insertedId) {
                        return new Response(true, result.insertedId);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create user'), 500, true));
                    }
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async get({ id, email }) {
        let query = {};
        if (id) query._id = new ObjectId(id);
        else if (email) query.email = email;
        else return new Response(false, new CustomError(new Error('No id or email provided'), 400, true));

        try {
            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(User.cName).findOne(query);
                    result = (result) ? new User(result) : null;
                    return new Response(true, result);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async remove({ id, email }) {
        let query = {};
        if (id) query._id = new ObjectId(id);
        else if (email) query.email = email;
        else return new Response(false, new CustomError(new Error('No id or email provided'), 400, true));

        try {
            let response = await useDB(async (db) => {
                try {
                    const result = await db.collection(User.cName).deleteOne(query);
                    if (result.deletedCount === 1) {
                        return new Response(true, null);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to remove user'), 500, true));
                    }
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async buy(userId, ticketId) {
        try {
            userId = stringToObjectId([userId])[0];
            ticketId = stringToObjectId([ticketId])[0];

            let response = await useDB(async (db) => {
                try {
                    const user = await db.collection(User.cName).findOne({ _id: new ObjectId(userId) });
                    if (!user) return new Response(false, new CustomError(new Error('User not found'), 404, true));

                    const category = await Category.getByTicket(ticketId);
                    if (!category.success) return category;

                    if (user.budget < category.data.price) return new Response(false, new CustomError(new Error('Not enough budget'), 400, true));

                    let result;
                    result = await Ticket.addUser(ticketId, userId);
                    if (!result.success) return result;

                    result = await db.collection(User.cName).updateOne({ _id: new ObjectId(userId) }, { $inc: { budget: -ticket.price } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to buy ticket'), 500, true));

                    return new Response(true, null);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async sell(userId, ticketId) {
        try {
            userId = stringToObjectId([userId])[0];
            ticketId = stringToObjectId([ticketId])[0];

            let response = await useDB(async (db) => {
                try {
                    const user = await db.collection(User.cName).findOne({ _id: new ObjectId(userId) });
                    if (!user) return new Response(false, new CustomError(new Error('User not found'), 404, true));

                    const category = await Category.getByTicket(ticketId);
                    if (!category.success) return category;

                    let result;
                    result = await Ticket.removeUser(ticketId, userId);
                    if (!result.success) return result;

                    result = await db.collection(User.cName).updateOne({ _id: new ObjectId(userId) }, { $inc: { budget: category.data.price } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to restitute ticket'), 500, true));

                    return new Response(true, null);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async increaseBudget(userId, amount) {
        try {
            userId = stringToObjectId([userId])[0];

            let response = await useDB(async (db) => {
                try {
                    const user = await db.collection(User.cName).findOne({ _id: userId });
                    if (!user) return new Response(false, new CustomError(new Error('User not found'), 404, true));

                    const result = await db.collection(User.cName).updateOne({ _id: userId }, { $inc: { budget: amount } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to increase budget'), 500, true));

                    return new Response(true, null);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async getTickets(userId) {
        try {
            userId = stringToObjectId([userId])[0];

            let response = await useDB(async (db) => {
                try {
                    const user = await db.collection(User.cName).findOne({ _id: userId });
                    if (!user) return new Response(false, new CustomError(new Error('User not found'), 404, true));

                    const result = await db.collection(Ticket.cName).find({ user: userId }).toArray();
                    return new Response(true, result.map(ticket => new Ticket(ticket)));
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

    static async controlToken(userId, token) {
        try {
            userId = stringToObjectId([userId])[0];

            let response = await useDB(async (db) => {
                try {
                    const user = await db.collection(User.cName).findOne({ _id: userId });
                    if (!user) return new Response(false, new CustomError(new Error('User not found'), 404, true));

                    if (user.token !== token) return new Response(false, new CustomError(new Error('Token mismatch'), 403, true));

                    return new Response(true, null);
                } catch (error) {
                    return new Response(false, new CustomError(error, 500));
                }
            });
            return response;
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }

}

module.exports = User;