const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const adminService = require('./admin.service');

const getDashboardStats = catchAsync(async (req, res) => {
    const result = await adminService.getDashboardStatsFromDB();
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Dashboard statistics fetched successfully",
        data: result
    });
});

module.exports = {
    getDashboardStats
};
