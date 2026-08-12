const express = require('express');
const cors = require('cors');
const userRouter = require('./modules/user/user.route');
const donationRouter = require('./modules/donation/donation.route');
const fundingRouter = require('./modules/funding/funding.route');
const blogRouter = require('./modules/blog/blog.route');
const adminRouter = require('./modules/admin/admin.route');
const { notFound } = require('./middleware/notFound');
const { globalErrorHandler } = require('./middleware/globalErrorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', userRouter);
app.use('/donations', donationRouter);
app.use('/fundings', fundingRouter);
app.use('/blogs', blogRouter);
app.use('/admin', adminRouter);

// Basic root route
app.get('/', (req, res) => {
    res.send('Blood donation Server is running');
});

// Route not found handling
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
