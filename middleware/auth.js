const admin = require('../config/firebase');
const { getCollection } = require('../config/db');

const verifyFBToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "forbidden access" });
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        const email = req.decoded.email;
        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne({ email: email });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyAdminOrVolunteer = async (req, res, next) => {
    try {
        const email = req.decoded.email;
        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne({ email: email });

        if (!user || (user.role !== 'admin' && user.role !== 'volunteer')) {
            return res.status(403).json({ message: 'Access denied. Admin and Volunteers only.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    verifyFBToken,
    verifyAdmin,
    verifyAdminOrVolunteer
};
