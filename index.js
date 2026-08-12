require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const port = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();