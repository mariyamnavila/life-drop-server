const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const blogService = require('./blog.service');
const { ObjectId } = require('mongodb');

const getAllBlogs = catchAsync(async (req, res) => {
    const { status = "all", page = 0, limit = 10 } = req.query;
    const result = await blogService.getBlogsFromDB(status, page, limit);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Blogs fetched successfully",
        data: result.blogs,
        meta: {
            page: result.currentPage,
            limit: parseInt(limit),
            total: result.totalCount,
            totalPages: result.totalPages
        }
    });
});

const getPublishedBlogs = catchAsync(async (req, res) => {
    const { page = 0, limit = 10 } = req.query;
    const result = await blogService.getPublishedBlogsFromDB(page, limit);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Published blogs fetched successfully",
        data: result.blogs,
        meta: {
            page: result.currentPage,
            limit: parseInt(limit),
            total: result.totalCount,
            totalPages: result.totalPages
        }
    });
});

const getBlogById = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid blog ID"
        });
    }

    const result = await blogService.getBlogByIdFromDB(id);
    if (!result) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Blog not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Blog details fetched successfully",
        data: result
    });
});

const createBlog = catchAsync(async (req, res) => {
    const result = await blogService.createBlogInDB(req.body, req.user);
    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Blog created successfully",
        data: { insertedId: result.insertedId }
    });
});

const updateBlogStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!ObjectId.isValid(id)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid blog ID"
        });
    }

    if (!["draft", "published"].includes(status)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid status value. Must be 'draft' or 'published'."
        });
    }

    const result = await blogService.updateBlogStatusInDB(id, status);
    if (result.matchedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Blog not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: `Blog status updated to "${status}" successfully`,
        data: result
    });
});

const deleteBlog = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid blog ID"
        });
    }

    const result = await blogService.deleteBlogFromDB(id);
    if (result.deletedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Blog not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Blog deleted successfully",
        data: result
    });
});

module.exports = {
    getAllBlogs,
    getPublishedBlogs,
    getBlogById,
    createBlog,
    updateBlogStatus,
    deleteBlog
};
