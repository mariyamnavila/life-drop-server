const { getCollection } = require('../../config/db');
const { ObjectId } = require('mongodb');

const getDonationsFromDB = async (email, status, page, limit) => {
    const donationsCollection = getCollection('donations');
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = pageNumber * pageSize;

    const query = {};
    if (email) query.requesterEmail = email;
    if (status) query.donationStatus = status;

    const totalCount = await donationsCollection.countDocuments(query);
    const donations = await donationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray();

    return {
        donations,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber
    };
};

const getPendingDonationsFromDB = async (page, limit, bloodGroup, district, upazila) => {
    const donationsCollection = getCollection('donations');
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = pageNumber * pageSize;

    const query = { donationStatus: "pending" };
    if (bloodGroup && bloodGroup !== "all") query.bloodGroup = bloodGroup;
    if (district && district !== "all") query.recipientDistrict = district;
    if (upazila && upazila !== "all") query.recipientUpazila = upazila;

    const totalCount = await donationsCollection.countDocuments(query);
    const donations = await donationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray();

    return {
        donations,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber
    };
};

const getDonationByIdFromDB = async (donationId) => {
    const donationsCollection = getCollection('donations');
    return await donationsCollection.findOne({ _id: new ObjectId(donationId) });
};

const createDonationInDB = async (donationData) => {
    const donationsCollection = getCollection('donations');
    const { requesterEmail, recipientName, donationDate } = donationData;

    const exists = await donationsCollection.findOne({
        requesterEmail,
        recipientName,
        donationDate,
        donationStatus: "pending",
    });

    if (exists) {
        return { isConflict: true };
    }

    const result = await donationsCollection.insertOne(donationData);
    return { ...result, isConflict: false };
};

const updateDonationDetailsInDB = async (donationId, updateData) => {
    const donationsCollection = getCollection('donations');
    delete updateData._id;
    return await donationsCollection.updateOne(
        { _id: new ObjectId(donationId) },
        { $set: updateData }
    );
};

const updateDonationStatusAndDonorInDB = async (donationId, donationStatus, donorName, donorEmail) => {
    const donationsCollection = getCollection('donations');
    return await donationsCollection.updateOne(
        { _id: new ObjectId(donationId) },
        {
            $set: {
                donationStatus,
                donorName,
                donorEmail
            }
        }
    );
};

const updateDonationStatusOnlyInDB = async (donationId, donationStatus) => {
    const donationsCollection = getCollection('donations');
    return await donationsCollection.updateOne(
        { _id: new ObjectId(donationId) },
        { $set: { donationStatus } }
    );
};

const deleteDonationFromDB = async (id) => {
    const donationsCollection = getCollection('donations');
    return await donationsCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
    getDonationsFromDB,
    getPendingDonationsFromDB,
    getDonationByIdFromDB,
    createDonationInDB,
    updateDonationDetailsInDB,
    updateDonationStatusAndDonorInDB,
    updateDonationStatusOnlyInDB,
    deleteDonationFromDB
};
