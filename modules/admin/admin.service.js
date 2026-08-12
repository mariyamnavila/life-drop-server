const { getCollection } = require('../../config/db');

const getDashboardStatsFromDB = async () => {
    const usersCollection = getCollection('users');
    const donationsCollection = getCollection('donations');
    const fundingsCollection = getCollection('funds');

    const totalUsers = await usersCollection.countDocuments();

    const totalFundsDoc = await fundingsCollection.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();
    const totalFunds = totalFundsDoc[0]?.total || 0;

    const totalDonations = await donationsCollection.countDocuments();

    return { totalUsers, totalFunds, totalDonations };
};

module.exports = {
    getDashboardStatsFromDB
};
