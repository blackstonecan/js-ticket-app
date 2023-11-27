const { ObjectId } = require("mongodb");

const useDB = require("../helpers/db/useDB");

const Model = require("./Model");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { stringToObjectId } = require("../helpers");
const { readImage } = require("../helpers/storage");

class Team extends Model {
    static cName = 'teams';

    constructor({ name, shortName, logo, _id }) {
        super(_id);
        this.name = name;
        this.shortName = shortName.toUpperCase();
        this.logo = logo || null;
    }

    static async createCollection() {
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(Team.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "Team object schema",
                            required: ["name", "shortName"],
                            properties: {
                                name: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                shortName: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                logo: {
                                    bsonType: "string",
                                    description: "must be a string"
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

    static controlFields(team) {
        let control = true;

        if (!team.name || typeof team.name !== 'string') control = false;
        if (!team.shortName || typeof team.shortName !== 'string') control = false;
        if (team.logo && typeof team.logo !== 'string') control = false;

        return new Response(control, null);
    }

    static async create(team) {
        try {
            let response = await useDB(async (db) => {
                try {
                    const existingTeam = await db.collection(Team.cName).findOne({
                        $or: [
                            { name: team.name },
                            { shortName: team.shortName }
                        ]
                    });
                    if (existingTeam) return new Response(false, new CustomError(new Error('Team already exists'), 400, true));

                    if (!team.logo) delete team.logo;

                    const result = await db.collection(Team.cName).insertOne(team);

                    if (result.insertedId) {
                        return new Response(true, result.insertedId);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create team'), 500, true));
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

    static async get({ id }) {
        if (!id || typeof id !== 'string') return new Response(false, new CustomError(new Error('No id provided'), 400, true));

        try {
            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Team.cName).findOne({ _id: new ObjectId(id) });
                    if (result){
                        result = new Team(result);

                        const imageResponse = await result.getImageURL();
                        if (!imageResponse.success) return imageResponse;

                        result.logo = imageResponse.data;
                    } else result = null;

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

    static async getMany({ ids }) {
        try {
            if (!ids || !Array.isArray(ids)) return new Response(false, new CustomError(new Error('No ids provided'), 400, true));
            ids = stringToObjectId(ids);

            let response = await useDB(async (db) => {
                try {
                    let result = await db.collection(Team.cName).find({ _id: { $in: ids } }).toArray();
                    result = result.map( async (team) => {
                        team = new Team(team);

                        const imageResponse = await result.getImageURL();
                        if (!imageResponse.success) return imageResponse;

                        team.logo = imageResponse.data;
                        return team;
                    });
                    
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

    static async remove({ id }) {
        if (!id || typeof id !== 'string') return new Response(false, new CustomError(new Error('No id provided'), 400, true));

        try {
            let response = await useDB(async (db) => {
                try {
                    const response = await Team.get({ id });
                    if (!response.success) return response;
                    if (!response.data) return new Response(false, new CustomError(new Error('Team not found'), 404, true));

                    if(response.data.logo && response.data.logo !== "") {
                        const imageResponse = await deleteImage(response.data.logo);
                        if (!imageResponse.success) return imageResponse;
                    }

                    const result = await db.collection(Team.cName).deleteOne({ _id: new ObjectId(id) });
                    if (result.deletedCount === 1) {
                        return new Response(true, null);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to remove team'), 500, true));
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

    static async update({id, name, shortName, logo}) {
        if (!id || typeof id !== 'string') return new Response(false, new CustomError(new Error('No id provided'), 400, true));

        try {
            let response = await useDB(async (db) => {
                try {
                    const existingTeam = await db.collection(Team.cName).findOne({
                        $or: [
                            { name },
                            { shortName }
                        ]
                    });
                    if (existingTeam) return new Response(false, new CustomError(new Error('Team already exists'), 400, true));

                    let update = {};
                    if (name) update.name = name;
                    if (shortName) update.shortName = shortName;
                    if (logo) update.logo = logo;

                    const result = await db.collection(Team.cName).updateOne({ _id: new ObjectId(id) }, { $set: update });
                    if (result.modifiedCount === 1) {
                        return new Response(true, null);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to update team'), 500, true));
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

    async getImageURL() {
        try {
            if (!this.logo || this.logo == "") return new Response(true, null);
    
            const imageResponse = await readImage(this.logo);
            if (!imageResponse.success) return imageResponse;
    
            return new Response(true, imageResponse.data);
        } catch (error) {
            return new Response(true, new CustomError(error, 500))
        }
    }
}

module.exports = Team;