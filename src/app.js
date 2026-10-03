const express = require('express');
const categoriesRoutes = require('./routes/categories.routes');
const productsRoutes = require('./routes/products.routes');
const skusRoutes = require('./routes/skus.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.use('/api/v1/admin/categories', categoriesRoutes);
app.use('/api/v1/admin/products', productsRoutes);
app.use('/api/v1/admin/skus', skusRoutes);

app.use(errorHandler);

module.exports = app;
