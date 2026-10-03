const Category = require('../models/Category');

async function createCategory(req, res, next) {
    try {
        const { title, topCategoryId } = req.body;


    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createCategory,
};
