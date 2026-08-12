const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const fundingService = require('./funding.service');
const stripe = require('../../config/stripe');

const getAllFundings = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await fundingService.getFundingsFromDB(page, limit);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Fundings fetched successfully",
        data: result.fundings,
        meta: {
            page,
            limit,
            total: result.totalCount
        }
    });
});

const createFunding = catchAsync(async (req, res) => {
    const result = await fundingService.createFundingInDB(req.body);
    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Funding created successfully",
        data: result
    });
});

const createPaymentIntent = catchAsync(async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return sendResponse(res, {
            success: false,
            statusCode: 400,
            message: "Amount is required"
        });
    }

    const amountInCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method_types: ["card"],
    });

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Payment intent created successfully",
        data: { clientSecret: paymentIntent.client_secret }
    });
});

module.exports = {
    getAllFundings,
    createFunding,
    createPaymentIntent
};
