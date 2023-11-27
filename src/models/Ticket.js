const useDB = require("../helpers/db/useDB");

const Model = require("./Model");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { dictToObjectId, stringToObjectId } = require("../helpers");

class Ticket extends Model {
    static cName = 'tickets';

    constructor({ seat, user = null, _id }) {
        super(_id);
        this.seat = seat;
        this.user = (user == "") ? null : user;
    }

    static async createCollection() {
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(Ticket.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "Ticket object schema",
                            required: ["seat"],
                            properties: {
                                seat: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                user: {
                                    bsonType: "objectId",
                                    description: "must be an object id"
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

    static controlFields(ticket) {
        let control = true;

        if (!ticket.seat || typeof ticket.seat !== 'string') control = false;
        if (ticket.user && typeof ticket.user !== 'string') control = false;

        return new Response(control, null);
    }

    static generateTickets(count, beforeCount = 0) {
        let tickets = [];
        for (let i = 1; i <= count; i++) {
            tickets.push(new Ticket({ seat: (beforeCount + i).toString() }));
        }
        return tickets;
    }

    static async createMany(tickets) {
        try {
            let response = await useDB(async (db) => {
                try {
                    tickets = tickets.map(ticket => {
                        if (!ticket.user) delete ticket.user;
                        return ticket;
                    });

                    const result = await db.collection(Ticket.cName).insertMany(tickets);

                    if (result.insertedCount) {
                        return new Response(true, dictToObjectId(result.insertedIds));
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create tickets'), 500, true));
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

    static async addUser(ticketId, userId) {
        try {
            ticketId = stringToObjectId([ticketId])[0];
            userId = stringToObjectId([userId])[0];

            let response = await useDB(async (db) => {
                try {
                    let result;
                    result = await db.collection(Ticket.cName).findOne({ _id: ticketId });
                    if (!result) return new Response(false, new CustomError(new Error('Ticket not found'), 404, true));

                    result = new Ticket(result);

                    if (result.user) return new Response(false, new CustomError(new Error('Ticket already has a user'), 400, true));

                    result = await db.collection(Ticket.cName).updateOne({ _id: ticketId }, { $set: { user: userId } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to add user to ticket'), 500, true));

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

    static async removeUser(ticketId, userId) {
        try {
            ticketId = stringToObjectId([ticketId])[0];
            userId = stringToObjectId([userId])[0];

            let response = await useDB(async (db) => {
                try {
                    let result;
                    result = await db.collection(Ticket.cName).findOne({ _id: ticketId });
                    if (!result) return new Response(false, new CustomError(new Error('Ticket not found'), 404, true));

                    result = new Ticket(result);

                    if (!result.user) return new Response(false, new CustomError(new Error('Ticket does not have a user'), 400, true));
                    if (!result.user.equals(userId)) return new Response(false, new CustomError(new Error('Ticket user does not match'), 400, true));

                    result = await db.collection(Ticket.cName).updateOne({ _id: ticketId }, { $unset: { user: "" } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to remove user from ticket'), 500, true));

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

module.exports = Ticket;