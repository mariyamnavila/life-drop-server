const express = require('express');
const userController = require('./user.controller');
const { verifyFBToken, verifyAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', verifyFBToken, verifyAdmin, userController.getAllUsers);
router.get('/search', userController.searchDonors);
router.get('/:email', verifyFBToken, userController.getUserByEmail);
router.get('/:email/role', userController.getUserRole);
router.post('/', userController.createUser);
router.put('/:email', userController.updateUserByEmail);
router.patch('/:id/status', verifyFBToken, userController.updateUserStatus);
router.patch('/:id/role', verifyFBToken, userController.updateUserRole);

module.exports = router;
