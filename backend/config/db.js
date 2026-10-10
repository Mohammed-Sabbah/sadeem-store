const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function connectDB() {
    try {
        const uri = process.env.DB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sadeem_db';
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

async function withMongoTransaction(callback) {
    const session = await mongoose.startSession();

    try {
        return await session.withTransaction(() => callback(session));
    } catch (txError) {
        const isNoReplicaSet = txError && txError.message && (
            txError.message.includes('replica set') ||
            txError.message.includes('Transaction numbers are only allowed')
        );

        if (isNoReplicaSet) {
            return await callback(null);
        }

        throw txError;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    connectDB,
    withMongoTransaction,
};
