const { getCollection } = require('../../config/db');

const getFundingsFromDB = async (page, limit) => {
    const fundingsCollection = getCollection('funds');
    const totalCount = await fundingsCollection.countDocuments();
    const fundings = await fundingsCollection
        .find()
        .sort({ date: -1 })
        .skip(page * limit)
        .limit(limit)
        .toArray();

    return { totalCount, fundings };
};

const createFundingInDB = async (fundingData) => {
    const fundingsCollection = getCollection('funds');
    return await fundingsCollection.insertOne(fundingData);
};

module.exports = {
    getFundingsFromDB,
    createFundingInDB
};
