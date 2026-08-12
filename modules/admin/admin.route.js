const express = require('express');
const adminController = require('./admin.controller');
const { verifyFBToken, verifyAdminOrVolunteer } = require('../../middleware/auth');

const router = express.Router();

router.get('/dashboard-stats', verifyFBToken, verifyAdminOrVolunteer, adminController.getDashboardStats);

module.exports = router;
