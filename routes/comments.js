const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/comment');

const router = express.Router();

// GET /api/comments?productId=xxx - Get comments for a product
router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    const comments = await Comment.find({ 
      productId: productId,
      isApproved: true 
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments - Create a new comment
router.post('/', async (req, res) => {
  try {
    const { productId, userName, userEmail, rating, comment, recommendProduct } = req.body;
    
    // Validation
    if (!productId || !userName || !userEmail || !rating || !comment) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    
    // Check comment length
    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment cannot exceed 1000 characters' });
    }
    
    // Check if user has already reviewed this product
    const hasReviewed = await Comment.hasUserReviewed(productId, userEmail);
    if (hasReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    
    // Create new comment
    const newComment = new Comment({
      productId,
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      rating,
      comment: comment.trim(),
      recommendProduct: recommendProduct || false
    });
    
    await newComment.save();
    
    res.status(201).json({
      message: 'Review submitted successfully',
      comment: newComment
    });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/comments/:id/like - Like a comment
router.put('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ 
      message: 'Comment liked successfully',
      likes: comment.likes 
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/comments/:id/report - Report a comment
router.put('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { reports: 1 } },
      { new: true }
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ 
      message: 'Comment reported successfully',
      reports: comment.reports 
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/comments/stats/:productId - Get rating statistics for a product
router.get('/stats/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const stats = await Comment.getAverageRating(productId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting comment stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/comments/admin/pending - Get pending comments (for admin)
router.get('/admin/pending', async (req, res) => {
  try {
    const pendingComments = await Comment.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('productId', 'title images')
      .lean();
    
    res.json(pendingComments);
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/comments/admin/:id/approve - Approve a comment (for admin)
router.put('/admin/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ 
      message: 'Comment approved successfully',
      comment 
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/comments/admin/:id - Delete a comment (for admin)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findByIdAndDelete(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;