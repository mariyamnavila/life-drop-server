const { getCollection } = require('../../config/db');
const { ObjectId } = require('mongodb');

const getBlogsFromDB = async (status, page, limit) => {
    const blogsCollection = getCollection('blogs');
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

    return {
        blogs,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber
    };
};

const getPublishedBlogsFromDB = async (page, limit) => {
    const blogsCollection = getCollection('blogs');
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = pageNumber * pageSize;

    const query = { status: "published" };
    const totalCount = await blogsCollection.countDocuments(query);
    const blogs = await blogsCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray();

    return {
        blogs,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber
    };
};

const getBlogByIdFromDB = async (id) => {
    const blogsCollection = getCollection('blogs');
    return await blogsCollection.findOne({ _id: new ObjectId(id) });
};

const createBlogInDB = async (blogData, user) => {
    const blogsCollection = getCollection('blogs');
    const blog = {
        ...blogData,
        status: "draft",
        author: {
            email: user.email,
            uid: user.uid,
            name: user.name || "Unknown",
        },
        created_at: new Date(),
        updated_at: new Date(),
    };
    return await blogsCollection.insertOne(blog);
};

const updateBlogStatusInDB = async (id, status) => {
    const blogsCollection = getCollection('blogs');
    return await blogsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updated_at: new Date() } }
    );
};

const deleteBlogFromDB = async (id) => {
    const blogsCollection = getCollection('blogs');
    return await blogsCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
    getBlogsFromDB,
    getPublishedBlogsFromDB,
    getBlogByIdFromDB,
    createBlogInDB,
    updateBlogStatusInDB,
    deleteBlogFromDB
};
