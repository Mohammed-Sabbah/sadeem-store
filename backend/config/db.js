require('dotenv').config();
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

module.exports = connectDB;
