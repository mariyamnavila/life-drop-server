const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        error: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
};

module.exports = { globalErrorHandler };
