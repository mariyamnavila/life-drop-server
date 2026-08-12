const express = require('express');
const fundingController = require('./funding.controller');
const { verifyFBToken } = require('../../middleware/auth');

const router = express.Router();

router.get('/', verifyFBToken, fundingController.getAllFundings);
router.post('/', fundingController.createFunding);
router.post('/create-payment-intent', fundingController.createPaymentIntent);

module.exports = router;
