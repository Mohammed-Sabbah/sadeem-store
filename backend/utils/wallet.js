function parsePositiveMoney(value, label) {
    if (value === '' || value === null || value === undefined || typeof value === 'boolean') {
        const error = new Error(`${label} must be a valid positive amount`);
        error.statusCode = 400;
        throw error;
    }

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000000 ||
        Math.round(amount * 100) !== amount * 100) {
        const error = new Error(`${label} must be a valid positive amount with at most two decimal places`);
        error.statusCode = 400;
        throw error;
    }
    return Math.round(amount * 100) / 100;
}

module.exports = {
    parsePositiveMoney,
}