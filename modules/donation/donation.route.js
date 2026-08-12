const express = require('express');
const donationController = require('./donation.controller');
const { verifyFBToken, verifyAdminOrVolunteer } = require('../../middleware/auth');

const router = express.Router();

router.get('/', verifyFBToken, donationController.getAllDonations);
router.get('/pending', donationController.getPendingDonations);
router.get('/:donationId', verifyFBToken, donationController.getDonationById);
router.post('/', verifyFBToken, donationController.createDonation);
router.patch('/:donationId', verifyFBToken, donationController.updateDonationStatusAndDonor);
router.patch('/:donationId/status', verifyFBToken, verifyAdminOrVolunteer, donationController.updateDonationStatusOnly);
router.put('/:donationId', verifyFBToken, donationController.updateDonationDetails);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;
