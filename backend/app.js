require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Pre-register all models to ensure Mongoose populate works reliably everywhere
require('./models/User');
require('./models/Store');
require('./models/Category');
require('./models/Product');
require('./models/Variant');
require('./models/Region');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/user.route")
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const variantRoutes = require('./routes/variantRoutes');
const storeRoutes = require('./routes/storeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const regionRoutes = require('./routes/regionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const withDrawalRoutes = require('./routes/withdrawal.route');
const depositRoutes = require('./routes/deposit.route');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products/:id/variants', variantRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawals', withDrawalRoutes);
app.use('/api/deposits', depositRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
