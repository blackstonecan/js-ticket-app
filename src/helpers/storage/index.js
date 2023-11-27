const bucket = require('./getBucket');

const Response = require('../models/Response');
const CustomError = require('../models/CustomError');

const { compressData, getImageFormat } = require('..');

const destinationPath = 'images';

const uploadImage = async (base64Data) => {
    try {
        const buffer = Buffer.from(base64Data, 'base64');

        const imageFormat = getImageFormat(buffer);
        if (!imageFormat.success) throw imageFormat.data;

        const compressedData = await compressData(buffer);
        if (!compressedData.success) throw compressedData.data;

        const random = Math.random().toString(36).substring(2, 12);

        const filename = `img_${Date.now()}_${random}.${imageFormat.data}`;

        const file = bucket.file(`${destinationPath}/${filename}`);
        await file.save(compressedData.data, {
            metadata: {
                contentType: `image/${imageFormat.data}`,
            },
        });

        return new Response(true, filename);
    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

const readImage = async (filename) => {
    try {
        const file = bucket.file(`${destinationPath}/${filename}`);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: new Date().getTime() + 1000 * 60 * 60 * 24 * 7, // 1 week
        });
        return new Response(true, url);

    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

const deleteImage = async (filename) => {
    try {
        const file = bucket.file(`${destinationPath}/${filename}`);

        await file.delete();

        return new Response(true, null);
    } catch (error) {
        return new Response(false, new CustomError(error, 500));
    }
}

module.exports = {
    uploadImage,
    readImage,
    deleteImage,
}