const { error, serverError } = require('../utils/responses');

function errorHandler(err, req, res, next) {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Something went wrong' : err.message;

    if (statusCode === 500) {
        return serverError(res, message);
    }
    return error(res, statusCode, message);
}

module.exports = errorHandler;
