const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const donationService = require('./donation.service');
const { ObjectId } = require('mongodb');

const getAllDonations = catchAsync(async (req, res) => {
    const { email, status, page = 0, limit = 10 } = req.query;
    const result = await donationService.getDonationsFromDB(email, status, page, limit);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donations fetched successfully",
        data: result.donations,
        meta: {
            page: result.currentPage,
            limit: parseInt(limit),
            total: result.totalCount,
            totalPages: result.totalPages
        }
    });
});

const getPendingDonations = catchAsync(async (req, res) => {
    const { page = 0, limit = 9, blood_group, district, upazila } = req.query;
    const result = await donationService.getPendingDonationsFromDB(page, limit, blood_group, district, upazila);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Pending donations fetched successfully",
        data: result.donations,
        meta: {
            page: result.currentPage,
            limit: parseInt(limit),
            total: result.totalCount,
            totalPages: result.totalPages
        }
    });
});

const getDonationById = catchAsync(async (req, res) => {
    const { donationId } = req.params;
    if (!ObjectId.isValid(donationId)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid donation ID"
        });
    }

    const result = await donationService.getDonationByIdFromDB(donationId);
    if (!result) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Donation not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donation details fetched successfully",
        data: result
    });
});

const createDonation = catchAsync(async (req, res) => {
    const result = await donationService.createDonationInDB(req.body);
    if (result.isConflict) {
        return sendResponse(res, {
            success: false,
            statusCode: 409,
            message: "You already have a similar pending donation request."
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Donation request created successfully",
        data: result
    });
});

const updateDonationDetails = catchAsync(async (req, res) => {
    const { donationId } = req.params;
    if (!ObjectId.isValid(donationId)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid donation ID"
        });
    }

    const result = await donationService.updateDonationDetailsInDB(donationId, req.body);
    if (result.matchedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Donation not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donation updated successfully",
        data: result
    });
});

const updateDonationStatusAndDonor = catchAsync(async (req, res) => {
    const { donationId } = req.params;
    if (!ObjectId.isValid(donationId)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid donation ID"
        });
    }

    const { donationStatus, donorName, donorEmail } = req.body;
    if (!donationStatus || !donorName || !donorEmail) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "donationStatus, donorName, and donorEmail are required"
        });
    }

    const result = await donationService.updateDonationStatusAndDonorInDB(donationId, donationStatus, donorName, donorEmail);
    if (result.matchedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Donation not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donation confirmed and in progress",
        data: result
    });
});

const updateDonationStatusOnly = catchAsync(async (req, res) => {
    const { donationId } = req.params;
    if (!ObjectId.isValid(donationId)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid donation ID"
        });
    }

    const { donationStatus } = req.body;
    if (!donationStatus) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "donationStatus is required"
        });
    }

    const result = await donationService.updateDonationStatusOnlyInDB(donationId, donationStatus);
    if (result.matchedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Donation not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donation status updated successfully",
        data: result
    });
});

const deleteDonation = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Invalid donation ID"
        });
    }

    const result = await donationService.deleteDonationFromDB(id);
    if (result.deletedCount === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 404,
            message: "Donation not found"
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Donation deleted successfully",
        data: result
    });
});

module.exports = {
    getAllDonations,
    getPendingDonations,
    getDonationById,
    createDonation,
    updateDonationDetails,
    updateDonationStatusAndDonor,
    updateDonationStatusOnly,
    deleteDonation
};
