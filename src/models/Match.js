const useDB = require("../helpers/db/useDB");

const Model = require("./Model");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { stringToObjectId } = require("../helpers");


class Match extends Model {
    static cName = 'matches';

    constructor({ teams = [], date, stadium, categories, _id }) {
        super(_id);
        this.teams = stringToObjectId(teams);
        this.date = new Date(date);
        this.stadium = stadium;
        this.categories = categories;
    }

    static async createCollection() {
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(Match.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "Match object schema",
                            required: ["teams", "date", "stadium", "categories"],
                            properties: {
                                teams: {
                                    bsonType: "array",
                                    description: "must be an array of two team ids",
                                    items: {
                                        bsonType: "objectId"
                                    },
                                    minItems: 2,
                                    maxItems: 2,
                                    uniqueItems: true
                                },
                                date: {
                                    bsonType: "date",
                                    description: "must be a date"
                                },
                                stadium: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                categories: {
                                    bsonType: "array",
                                    description: "must be an array of category ids",
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
            return new Response(500, new CustomError(error, 500));
        }
    }

    static reverseTeams(teams) {
        return [teams[1], teams[0]];
    }

    static controlFields(match) {
        let control = true;

        if (!match.teams || !Array.isArray(match.teams) || match.teams.length !== 2) control = false;
        if (!match.date || typeof match.date !== 'string') control = false;
        if (!match.stadium || typeof match.stadium !== 'string') control = false;
        if (match.categories && !Array.isArray(match.categories) || match.categories.length != 2) control = false;

        return new Response(control, null);
    }

    static async create(match) {
        try {
            let response = await useDB(async (db) => {
                try {
                    const existingMatch = await db.collection(Match.cName).findOne({
                        $and: [
                            {
                                $or: [
                                    { teams: match.teams },
                                    { teams: Match.reverseTeams(match.teams) }
                                ]
                            },
                            { date: new Date(match.date) }
                        ]
                    });

                    if (existingMatch) return new Response(false, new CustomError(new Error('Match already exists'), 400, true));

                    const result = await db.collection(Match.cName).insertOne(match);

                    if (result.insertedId) {
                        return new Response(true, result.insertedId);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create match'), 500, true));
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

    static async get(id) {
        try {
            if (!id) return new Response(false, new CustomError(new Error('Invalid match id'), 400, true));
            id = stringToObjectId([id])[0];

            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Match.cName).findOne({ _id: id });
                    result = (result) ? new Match(result) : null;
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

    static async getAll() {
        try {
            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Match.cName).find({}).toArray();
                    
                    result = result.map((match) => new Match(match));

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

    static async update({ id, date, stadium}) {
        try {
            if (!id) return new Response(false, new CustomError(new Error('Invalid match id'), 400, true));
            id = stringToObjectId([id])[0];

            let response = await useDB(async (db) => {
                try {
                    let update = {};
                    if (date) update.date = new Date(date);
                    if (stadium) update.stadium = stadium;

                    let result = await db.collection(Match.cName).updateOne({ _id: id }, { $set: update });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to update match'), 500, true));

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

    static async addCategory(matchId, categoryId) {
        try {
            if (!matchId) return new Response(false, new CustomError(new Error('Invalid match id'), 400, true));
            if (!categoryId) return new Response(false, new CustomError(new Error('Invalid category id'), 400, true));

            matchId = stringToObjectId([matchId])[0];
            categoryId = stringToObjectId([categoryId])[0];

            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Match.cName).updateOne({ _id: matchId }, { $addToSet: { categories: categoryId } });
                    if (!result.modifiedCount) return new Response(false, new CustomError(new Error('Failed to add category to match'), 500, true));

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

module.exports = Match;