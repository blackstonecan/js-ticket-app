const zlib = require('zlib');
const sizeOf = require('image-size');
const { ObjectId } = require('mongodb');

const Response = require('./models/Response');
const CustomError = require('./models/CustomError');

const stringToObjectId = (list) => {
    for (let i = 0; i < list.length; i++) {
        if (typeof list[i] === 'string') list[i] = new ObjectId(list[i]);
    }
    return list;
}

const dictToObjectId = (dict) => {
    let result = [];
    for (const key in dict) {
        if (Object.hasOwnProperty.call(dict, key)) {
            const element = dict[key];
            if (typeof element === 'string') result.push(ObjectId(element));
            else result.push(element);
        }
    }
    return result;
}

const compressData = async (buffer) => {
    return new Promise((resolve, reject) => {
        zlib.deflate(buffer, (err, compressedBuffer) => {
            if (err) {
                reject(new Response(false, new CustomError(err, 500)));
            } else {
                resolve(new Response(true, compressedBuffer));
            }
        });
    });
};

const getImageFormat = (buffer) => {
    try {
        const dimensions = sizeOf(buffer);

        const type = dimensions.type;

        if (type) {
            return new Response(true, type.ext);
        } else {
            return new Response(false, new CustomError(new Error('Invalid image format'), 400, true));
        }
    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

module.exports = {
    stringToObjectId,
    dictToObjectId,
    compressData,
    getImageFormat,
};