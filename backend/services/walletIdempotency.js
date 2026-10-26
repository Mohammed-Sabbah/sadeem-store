const crypto = require('crypto');
const mongoose = require('mongoose');
const WalletIdempotency = require('../models/WalletIdempotency');

function canonicalize(value) {
    if (value instanceof mongoose.Types.ObjectId) {
        return value.toHexString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            if (value[key] !== undefined) {
                result[key] = canonicalize(value[key]);
            }
            return result;
        }, {});
    }
    return value;
}

function toPlainObject(value) {
    if (value && typeof value.toObject === 'function') {
        return toPlainObject(value.toObject({ flattenMaps: true }));
    }
    if (Array.isArray(value)) {
        return value.map(toPlainObject);
    }
    if (value && typeof value === 'object' &&
        !(value instanceof Date) &&
        !(value instanceof mongoose.Types.ObjectId) &&
        !Buffer.isBuffer(value)) {
        return Object.keys(value).reduce((result, key) => {
            result[key] = toPlainObject(value[key]);
            return result;
        }, {});
    }
    return value;
}

function createIdempotencyError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function withMongoTransaction(operation) {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(() => operation(session));
    } finally {
        await session.endSession();
    }
}

function assertMatchingRequest(record, requestHash) {
    if (record.requestHash !== requestHash) {
        throw createIdempotencyError(
            'Idempotency key has already been used with a different request',
            409
        );
    }
    return record.result;
}

async function withWalletIdempotency({
    userId,
    idempotencyKey,
    operation,
    payload,
    session = null,
}, execute) {
    const key = typeof idempotencyKey === 'string' ? idempotencyKey.trim() : '';
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw createIdempotencyError('Invalid idempotency user id');
    }
    if (!key || key.length > 128) {
        throw createIdempotencyError('A valid idempotency key is required');
    }

    const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(canonicalize({ operation, payload })))
        .digest('hex');

    const executeOnce = async (transactionSession) => {
        const existingRecord = await WalletIdempotency.findOne({
            userId,
            key,
        }).session(transactionSession).lean();
        if (existingRecord) {
            return assertMatchingRequest(existingRecord, requestHash);
        }

        const result = toPlainObject(await execute(transactionSession, key));
        if (result && result.ok === false) {
            return result;
        }

        await WalletIdempotency.create([{
            userId,
            key,
            requestHash,
            result,
        }], { session: transactionSession });

        return result;
    };

    if (session) {
        return executeOnce(session);
    }

    try {
        return await withMongoTransaction(executeOnce);
    } catch (error) {
        const duplicateIdempotencyKey = error.code === 11000 &&
            error.keyPattern &&
            error.keyPattern.userId === 1 &&
            error.keyPattern.key === 1;
        if (!duplicateIdempotencyKey) {
            throw error;
        }

        const existingRecord = await WalletIdempotency.findOne({ userId, key }).lean();
        if (!existingRecord) {
            throw error;
        }
        return assertMatchingRequest(existingRecord, requestHash);
    }
}

module.exports = {
    withWalletIdempotency,
};
