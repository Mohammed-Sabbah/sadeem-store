require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const port = Number(process.env.PORT || 5000);

async function startServer() {
    try {
        await connectDB();
    } catch (error) {
        console.warn('Server started without a MongoDB connection. Set MONGODB_URI to enable database features.');
    }

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

startServer();

module.exports = app;
