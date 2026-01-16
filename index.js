// index.js
const express = require('express');
const cors = require('cors');

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// life-drop
// sIlMPqWvoMl3u7hD

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster033.bpxhzqh.mongodb.net/?appName=Cluster033`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('life-drop')
        const usersCollection = db.collection('users');
        const donationsCollection = db.collection('donations');

        // MongoDB collections and routes setup
        app.get('/users', async (req, res) => {
            try {
                const users = await usersCollection.find({}).toArray();
                res.status(200).json({ success: true, users });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // GET /users/:email/role - get role and status only
        app.get('/users/:email/role', async (req, res) => {
            try {
                const email = req.params.email;

                const user = await usersCollection.findOne(
                    { email: email },
                    { projection: { role: 1, status: 1, _id: 0 } } // only role & status
                );

                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                res.status(200).json(user);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        app.post('/users', async (req, res) => {
            try {
                const email = req.body.email;

                const existingUser = await usersCollection.findOne({ email: email });
                if (existingUser) {
                    return res.status(200).json({ message: "User already exists", inserted: false });
                }
                const userData = req.body;
                const result = await usersCollection.insertOne(userData);

                res.send(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // POST /donations - add a new donation request
        app.post('/donations', async (req, res) => {
            try {
                const donationData = req.body;

                const result = await donationsCollection.insertOne(donationData);

                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// Basic route
app.get('/', (req, res) => {
    res.send('Blood donation Server is running');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});