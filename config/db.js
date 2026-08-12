const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster033.bpxhzqh.mongodb.net/?appName=Cluster033`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db = null;

const connectDB = async () => {
    if (db) return db;
    // Connect client (optional starting in v4.7)
    // await client.connect();
    db = client.db('life-drop');
    console.log("Connected to MongoDB successfully!");
    return db;
};

const getCollection = (collectionName) => {
    if (!db) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return db.collection(collectionName);
};

module.exports = {
    connectDB,
    getCollection,
    client
};
