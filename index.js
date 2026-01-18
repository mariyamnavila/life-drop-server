// index.js
const express = require('express');
const cors = require('cors');

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

        // GET /users/:email - fetch single user by email
        app.get('/users/:email', async (req, res) => {
            try {
                const { email } = req.params;

                const user = await usersCollection.findOne({ email: email });

                if (!user) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }

                res.status(200).json(user);
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

        // GET /donations - paginated & filtered
        app.get('/donations', async (req, res) => {
            try {
                const {
                    email,
                    status,
                    page = 0,
                    limit = 10
                } = req.query;

                const pageNumber = parseInt(page);
                const pageSize = parseInt(limit);
                const skip = pageNumber * pageSize;

                // Dynamic query
                const query = {};
                if (email) query.requesterEmail = email;
                if (status) query.donationStatus = status;

                // Get total count
                const totalCount = await donationsCollection.countDocuments(query);

                // Get paginated data
                const donations = await donationsCollection
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
                    .toArray();

                res.status(200).json({
                    donations,
                    totalCount,
                    totalPages: Math.ceil(totalCount / pageSize),
                    currentPage: pageNumber,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        // GET /donations/search?blood_group=A+&district=Dhaka&upazila=Savar
        app.get("/donations/search", async (req, res) => {
            try {
                const { blood_group, district, upazila } = req.query;
                const query = { donationStatus: "pending" }; // only pending donations are searchable

                if (blood_group) query.bloodGroup = blood_group;
                if (district) query.recipientDistrict = district;
                if (upazila) query.recipientUpazila = upazila;

                const donations = await donationsCollection.find(query).sort({ createdAt: -1 }).toArray();

                res.status(200).json(donations);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // GET /donations/:donationId - fetch single donation by ID
        app.get('/donations/:donationId', async (req, res) => {
            try {
                const { donationId } = req.params;

                // Validate ObjectId
                if (!ObjectId.isValid(donationId)) {
                    return res.status(400).json({ success: false, message: "Invalid donation ID" });
                }

                const donation = await donationsCollection.findOne({ _id: new ObjectId(donationId) });

                if (!donation) {
                    return res.status(404).json({ success: false, message: "Donation not found" });
                }

                res.status(200).json(donation);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
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

        // PATCH /donations/:donationId - update status and donor info
        app.patch('/donations/:donationId', async (req, res) => {
            try {
                const { donationId } = req.params;

                // Validate ObjectId
                if (!ObjectId.isValid(donationId)) {
                    return res.status(400).json({ success: false, message: "Invalid donation ID" });
                }

                const { donationStatus, donorName, donorEmail } = req.body;

                if (!donationStatus || !donorName || !donorEmail) {
                    return res.status(400).json({ success: false, message: "donationStatus, donorName, and donorEmail are required" });
                }

                // Update the donation
                const result = await donationsCollection.updateOne(
                    { _id: new ObjectId(donationId) },
                    {
                        $set: {
                            donationStatus,
                            donorName,
                            donorEmail
                        }
                    }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "Donation not found" });
                }

                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // PATCH /donations/:donationId/status - update only donationStatus
        app.patch('/donations/:donationId/status', async (req, res) => {
            try {
                const { donationId } = req.params;
                const { donationStatus } = req.body;

                if (!ObjectId.isValid(donationId)) {
                    return res.status(400).json({ success: false, message: "Invalid donation ID" });
                }

                if (!donationStatus) {
                    return res.status(400).json({ success: false, message: "donationStatus is required" });
                }

                const result = await donationsCollection.updateOne(
                    { _id: new ObjectId(donationId) },
                    { $set: { donationStatus } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "Donation not found" });
                }

                res.status(200).json({ success: true, message: "Donation status updated successfully" });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        app.put('/donations/:donationId', async (req, res) => {
            try {
                const { donationId } = req.params;
                const data = req.body;

                if (!ObjectId.isValid(donationId)) {
                    return res.status(400).json({ success: false, message: "Invalid donation ID" });
                }

                if (!data || Object.keys(data).length === 0) {
                    return res.status(400).json({ success: false, message: "No data provided" });
                }

                // Protect _id
                delete data._id;

                const result = await donationsCollection.updateOne(
                    { _id: new ObjectId(donationId) },
                    { $set: data }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "Donation not found" });
                }

                res.status(200).json({
                    success: true,
                    message: "Donation updated successfully"
                });
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