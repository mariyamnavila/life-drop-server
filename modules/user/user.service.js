const { getCollection } = require('../../config/db');
const { ObjectId } = require('mongodb');

const getUsersFromDB = async (status, page, limit) => {
    const usersCollection = getCollection('users');
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

    return {
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber,
    };
};

const searchDonorsFromDB = async (bloodGroup, district, upazila) => {
    const usersCollection = getCollection('users');
    if (!bloodGroup && !district && !upazila) {
        return [];
    }

    const query = { role: "donor", status: "active" };
    if (bloodGroup && bloodGroup !== "all") query.blood_group = bloodGroup;
    if (district && district !== "all") query.district = district;
    if (upazila && upazila !== "all") query.upazila = upazila;

    return await usersCollection
        .find(query)
        .sort({ created_at: -1 })
        .toArray();
};

const getUserByEmailFromDB = async (email) => {
    const usersCollection = getCollection('users');
    return await usersCollection.findOne({ email });
};

const getUserRoleFromDB = async (email) => {
    const usersCollection = getCollection('users');
    return await usersCollection.findOne(
        { email },
        { projection: { role: 1, status: 1, _id: 0 } }
    );
};

const createUserInDB = async (userData) => {
    const usersCollection = getCollection('users');
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        return { message: "User already exists", inserted: false };
    }
    const result = await usersCollection.insertOne(userData);
    return { ...result, inserted: true };
};

const updateUserByEmailInDB = async (email, updateData) => {
    const usersCollection = getCollection('users');
    delete updateData._id;
    return await usersCollection.updateOne(
        { email },
        { $set: updateData }
    );
};

const updateUserStatusInDB = async (id, status) => {
    const usersCollection = getCollection('users');
    return await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );
};

const updateUserRoleInDB = async (id, role) => {
    const usersCollection = getCollection('users');
    return await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
    );
};

module.exports = {
    getUsersFromDB,
    searchDonorsFromDB,
    getUserByEmailFromDB,
    getUserRoleFromDB,
    createUserInDB,
    updateUserByEmailInDB,
    updateUserStatusInDB,
    updateUserRoleInDB
};
