const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"]);

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isImage = file.mimetype.startsWith("image/");
    const isImageWithMissingMimeType =
        file.mimetype === "application/octet-stream" && imageExtensions.has(extension);

    if (isImage || isImageWithMissingMimeType) {
        cb(null, true);
    } else {
        cb(new Error(`Only image files are allowed. Received ${file.mimetype} for ${file.originalname}.`));
    }
};

module.exports = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 8,
    },
    fileFilter,
});