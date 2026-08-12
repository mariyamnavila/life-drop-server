const express = require('express');
const blogController = require('./blog.controller');
const { verifyFBToken, verifyAdmin, verifyAdminOrVolunteer } = require('../../middleware/auth');

const router = express.Router();

router.get('/', verifyFBToken, verifyAdminOrVolunteer, blogController.getAllBlogs);
router.get('/published', blogController.getPublishedBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', verifyFBToken, verifyAdminOrVolunteer, blogController.createBlog);
router.patch('/:id/status', verifyFBToken, verifyAdmin, blogController.updateBlogStatus);
router.delete('/:id', verifyFBToken, verifyAdmin, blogController.deleteBlog);

module.exports = router;
