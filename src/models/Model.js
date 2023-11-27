class Model {
    static cName() {
        throw new Error('cName not implemented');
    }

    static async createCollection() {
        throw new Error('createCollection not implemented');
    }

    constructor(_id) {
        this._id = _id;
    }
}

module.exports = Model