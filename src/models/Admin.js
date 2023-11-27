const { ObjectId } = require("mongodb");

const useDB = require("../helpers/db/useDB");

const Model = require("./Model");

const Response = require("../helpers/models/Response");
const CustomError = require("../helpers/models/CustomError");

const { hash } = require("../helpers/auth");


class Admin extends Model{
    static cName = 'admins';

    constructor({firstName, lastName, email, password, token, _id }) {
        super(_id);
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        if (token) this.token = token;
    }

    static async createCollection(){
        try {
            let response = await useDB(async (db) => {
                await db.createCollection(Admin.cName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            title: "Admin object schema",
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

    static controlFields(admin) {
        let control = true;

        if (!admin.firstName || typeof admin.firstName !== 'string') control = false;
        if (!admin.lastName || typeof admin.lastName !== 'string') control = false;
        if (!admin.email || typeof admin.email !== 'string') control = false;
        if (!admin.password || typeof admin.password !== 'string') control = false;

        return new Response(control, null);
    }

    static async create(admin) {
        try {
            let response = await useDB(async (db) => {
                try {
                    const existingUser = await db.collection(Admin.cName).findOne({ email: admin.email });
                    if (existingUser) return new Response(false, new CustomError(new Error('Admin email already exists'), 400, true));

                    admin.password = hash(admin.password);

                    const result = await db.collection(Admin.cName).insertOne(admin);

                    if (result.insertedId) {
                        return new Response(true, result.insertedId);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to create admin'), 500, true));
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
                    let result = await db.collection(Admin.cName).findOne(query);
                    result = (result) ? new Admin(result) : null;
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
                    const result = await db.collection(Admin.cName).deleteOne(query);
                    if (result.deletedCount === 1) {
                        return new Response(true, null);
                    } else {
                        return new Response(false, new CustomError(new Error('Failed to remove admin'), 500, true));
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
    
    static async controlToken(adminId, token) {
        try {
            adminId = stringToObjectId([adminId])[0];

            let response = await useDB(async (db) => {
                try {
                    const admin = await db.collection(Admin.cName).findOne({ _id: adminId });
                    if (!admin) return new Response(false, new CustomError(new Error('Admin not found'), 404, true));

                    if (admin.token !== token) return new Response(false, new CustomError(new Error('Token mismatch'), 403, true));

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

module.exports = Admin;