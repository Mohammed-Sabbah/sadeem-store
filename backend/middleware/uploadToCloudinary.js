const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadBuffer = (file, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
    });
};

const uploadImages = (folder) => {
    return async (req, res, next) => {
        try {
            let files = [];
            if (Array.isArray(req.files)) {
                files = req.files;
            } else if (req.files && typeof req.files === "object") {
                files = Object.values(req.files).flat();
            } else if (req.file) {
                files = [req.file];
            }

            if (!files?.length) {
                return next();
            }

            const uploads = await Promise.all(
                files.map((file) => uploadBuffer(file, folder))
            );
            const urls = uploads.map((image) => image.secure_url);
            req.body.images = urls;
            if (urls.length > 0) {
                req.body.proofPhoto = urls[0];
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = uploadImages;