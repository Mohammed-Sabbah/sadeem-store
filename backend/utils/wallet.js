const roundMoney = (value) => Number(Number(value).toFixed(2));

const isMoneyAmount = (value) => {
    if (!Number.isFinite(value)) {
        return false;
    }

    const roundedAmount = roundMoney(value);
    const precisionTolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 4;
    return Math.abs(value - roundedAmount) <= precisionTolerance;
};

function parsePositiveMoney(value, label) {
    if (
        value === '' ||
        value === null ||
        value === undefined ||
        typeof value === 'boolean' ||
        typeof value === 'object'
    ) {
        const error = new Error(`${label} must be a valid positive amount`);
        error.statusCode = 400;
        throw error;
    }

    const amount = Number(value);

    if (
        amount < 0 ||
        amount > 100000000 ||
        !isMoneyAmount(amount)
    ) {
        const error = new Error(
            `${label} must be a valid positive amount with at most two decimal places`
        );
        error.statusCode = 400;
        throw error;
    }

    return roundMoney(amount);
}

module.exports = {
    roundMoney,
    isMoneyAmount,
    parsePositiveMoney,
}