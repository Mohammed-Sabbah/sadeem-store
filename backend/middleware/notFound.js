const { error } = require('../utils/responses');

function notFound(req, res) {
    return error(res, 404, 'Route not found');
}

module.exports = notFound;
