// index.js
const express = require('express');
const cors = require('cors');
const Stripe = require("stripe");
const admin = require("firebase-admin");

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const stripe = new Stripe(process.env.PAYMENT_GATEWAY_KEY);

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
        const fundingsCollection = db.collection('funds');
        const blogsCollection = db.collection('blogs')

        // custom middleware
        const verifyFBToken = async (req, res, next) => {
            const authHeader = req.headers.authorization
            // If not, return res.status(401).json({ message: "Unauthorized" });
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Unauthorized access" });
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: "Unauthorized access" });
            }
            // If verified, call next()

            try {
                const decoded = await admin.auth().verifyIdToken(token)
                req.decoded = decoded
                next();
            } catch (error) {
                return res.status(403).json({ message: "forbidden access" });
            }
        }

        // Middleware to check if user is admin
        const verifyAdmin = async (req, res, next) => {
            try {
                const email = req.decoded.email; // from verifyFBToken middleware

                const user = await usersCollection.findOne({ email: email });

                if (!user || user.role !== 'admin') {
                    return res.status(403).json({ message: 'Access denied. Admin only.' });
                }

                req.user = user; // attach user to request
                next();
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error.message });
            }
        };

        const verifyAdminOrVolunteer = async (req, res, next) => {
            try {
                const email = req.decoded.email; // from verifyFBToken middleware

                const user = await usersCollection.findOne({ email: email });

                if (!user || (user.role !== 'admin' && user.role !== 'volunteer')) {
                    return res.status(403).json({ message: 'Access denied. Admin and Volunteers only.' });
                }

                req.user = user; // attach user to request
                next();
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error.message });
            }
        };

        // MongoDB collections and routes setup
        // GET /users
        app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
            try {
                const { status, page = 0, limit = 10 } = req.query;

                const query = {};
                if (status && status !== "all") {
                    query.status = status;
                }

                const pageNumber = parseInt(page);
                const pageSize = parseInt(limit);
                const skip = pageNumber * pageSize;

                const totalCount = await usersCollection.countDocuments(query);

                const users = await usersCollection
                    .find(query)
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(pageSize)
                    .toArray();

                res.json({
                    users,
                    totalCount,
                    totalPages: Math.ceil(totalCount / pageSize),
                    currentPage: pageNumber,
                });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
            }
        });


        // GET /users/:email - fetch single user by email
        app.get('/users/:email', verifyFBToken, async (req, res) => {
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

        // PUT /users/:email - update user by email
        app.put('/users/:email', async (req, res) => {
            try {
                const { email } = req.params;
                const data = req.body;

                if (!data || Object.keys(data).length === 0) {
                    return res.status(400).json({ success: false, message: "No data provided to update" });
                }

                // Protect _id from being overwritten
                delete data._id;

                const result = await usersCollection.updateOne(
                    { email: email },
                    { $set: data }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }

                res.status(200).json({ success: true, message: "User updated successfully" });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // PATCH /users/:id/status
        app.patch("/users/:id/status", verifyFBToken, async (req, res) => {
            const { status } = req.body;

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { status } }
            );

            res.json(result);
        });

        // PATCH /users/:id/role
        app.patch("/users/:id/role", verifyFBToken, async (req, res) => {
            const { role } = req.body;

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { role } }
            );

            res.json(result);
        });

        // GET /donations - paginated & filtered
        app.get('/donations', verifyFBToken, async (req, res) => {
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

        // GET /donations/pending - get only pending donation requests (limited fields)
        app.get('/donations/pending', async (req, res) => {
            try {
                const { page = 0, limit = 9 } = req.query;

                const pageNumber = parseInt(page);
                const pageSize = parseInt(limit);
                const skip = pageNumber * pageSize;

                // Fixed query: only pending donations
                const query = { donationStatus: "pending" };

                // Total count for pagination
                const totalCount = await donationsCollection.countDocuments(query);

                // Paginated data
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
                    currentPage: pageNumber
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
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
        app.get('/donations/:donationId', verifyFBToken, async (req, res) => {
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
        app.patch('/donations/:donationId', verifyFBToken, async (req, res) => {
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
        app.patch('/donations/:donationId/status', verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
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

        app.put('/donations/:donationId', verifyFBToken, async (req, res) => {
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

        // GET /admin/dashboard-stats
        app.get("/admin/dashboard-stats", verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
            try {
                // Count all users (donors, volunteers, admins)
                const totalUsers = await usersCollection.countDocuments();

                // Total funding (sum of all donations to funding collection)
                const totalFundsDoc = await fundingsCollection.aggregate([
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]).toArray();
                const totalFunds = totalFundsDoc[0]?.total || 0;

                // Total blood donation requests
                const totalDonations = await donationsCollection.countDocuments();

                res.json({ totalUsers, totalFunds, totalDonations });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
            }
        });

        app.get("/fundings", verifyFBToken, async (req, res) => {
            const page = parseInt(req.query.page) || 0;
            const limit = parseInt(req.query.limit) || 10;

            try {
                const totalCount = await fundingsCollection.countDocuments();
                const fundings = await fundingsCollection
                    .find()
                    .sort({ date: -1 })
                    .skip(page * limit)
                    .limit(limit)
                    .toArray();

                res.status(200).json({ totalCount, fundings });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        app.post("/fundings", async (req, res) => {
            try {
                const fundingData = req.body; // { userName, userEmail, amount, transactionId, date }

                const result = await fundingsCollection.insertOne(fundingData);

                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // POST /fundings/create-payment-intent
        // 1️ Create Stripe Payment Intent
        app.post("/fundings/create-payment-intent", async (req, res) => {
            const { amount } = req.body; // USD

            try {
                if (!amount || amount <= 0) {
                    return res.status(400).json({ message: "Amount is required" });
                }

                const amountInCents = Math.round(amount * 100);

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountInCents,
                    currency: "usd",
                    payment_method_types: ["card"],
                });

                res.status(200).json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                console.error("Stripe error:", error);
                res.status(500).json({ message: "Failed to create payment intent", error: error.message });
            }
        });

        // Blogs APIs

        app.get("/blogs", verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
            try {
                const { status = "all", page = 0, limit = 10 } = req.query;

                const query = {};
                if (status !== "all") {
                    query.status = status;
                }

                const pageNumber = parseInt(page);
                const pageSize = parseInt(limit);
                const skip = pageNumber * pageSize;

                const totalCount = await blogsCollection.countDocuments(query);

                const blogs = await blogsCollection
                    .find(query)
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(pageSize)
                    .toArray();

                res.json({
                    blogs,
                    totalCount,
                    totalPages: Math.ceil(totalCount / pageSize),
                    currentPage: pageNumber,
                });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
            }
        });

        app.post("/blogs", verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
            // req.user is available here
            const { title, thumbnail, content } = req.body;

            const blog = {
                title,
                thumbnail,
                content,
                status: "draft",
                author: {
                    email: req.user.email,
                    uid: req.user.uid,
                    name: req.user.name || "Unknown",
                },
                created_at: new Date(),
                updated_at: new Date(),
            };

            const result = await blogsCollection.insertOne(blog);
            res.status(201).json({ success: true, insertedId: result.insertedId });
        });


        app.delete("/blogs/:id", verifyFBToken, verifyAdmin, async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ success: false, message: "Invalid blog ID" });
                }

                const result = await blogsCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ success: false, message: "Blog not found" });
                }

                res.status(200).json({ success: true, message: "Blog deleted successfully" });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
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