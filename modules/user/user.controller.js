const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const userService = require('./user.service');

const getAllUsers = catchAsync(async (req, res) => {
    const { status, page = 0, limit = 10 } = req.query;
    const result = await userService.getUsersFromDB(status, page, limit);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Users fetched successfully",
        data: result.users,
        meta: {
            page: result.currentPage,
            limit: parseInt(limit),
            total: result.totalCount,
            totalPages: result.totalPages
        }
    });
});

const searchDonors = catchAsync(async (req, res) => {
    const { blood_group, district, upazila } = req.query;
    const result = await userService.searchDonorsFromDB(blood_group, district, upazila);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donors fetched successfully",
        data: result
    });
});

const getUserByEmail = catchAsync(async (req, res) => {
    const { email } = req.params;
    const result = await userService.getUserByEmailFromDB(email);
    if (!result) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "User not found"
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User details fetched successfully",
        data: result
    });
});

const getUserRole = catchAsync(async (req, res) => {
    const { email } = req.params;
    const result = await userService.getUserRoleFromDB(email);
    if (!result) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "User not found"
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User role fetched successfully",
        data: result
    });
});

const createUser = catchAsync(async (req, res) => {
    const result = await userService.createUserInDB(req.body);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: result.inserted ? "User created successfully" : "User already exists",
        data: result
    });
});

const updateUserByEmail = catchAsync(async (req, res) => {
    const { email } = req.params;
    const result = await userService.updateUserByEmailInDB(email, req.body);
    if (result.matchedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "User not found"
        });
    }
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User updated successfully"
    });
});

const updateUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await userService.updateUserStatusInDB(id, status);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User status updated successfully",
        data: result
    });
});

const updateUserRole = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await userService.updateUserRoleInDB(id, role);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User role updated successfully",
        data: result
    });
});

module.exports = {
    getAllUsers,
    searchDonors,
    getUserByEmail,
    getUserRole,
    createUser,
    updateUserByEmail,
    updateUserStatus,
    updateUserRole
};
