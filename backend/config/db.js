require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('MongoDB connected');
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

module.exports = connectDB;
