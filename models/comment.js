const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  recommendProduct: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  reports: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for better query performance
commentSchema.index({ productId: 1, createdAt: -1 });
commentSchema.index({ userEmail: 1, productId: 1 });

// Static method to get average rating for a product
commentSchema.statics.getAverageRating = async function(productId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isApproved: true
        }
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    return result.length > 0 ? {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount
    } : {
      averageRating: 0,
      reviewCount: 0
    };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return {
      averageRating: 0,
      reviewCount: 0
    };
  }
};

// Instance method to check if user has already reviewed this product
commentSchema.statics.hasUserReviewed = async function(productId, userEmail) {
  try {
    const existingReview = await this.findOne({
      productId: productId,
      userEmail: userEmail.toLowerCase()
    });
    
    return !!existingReview;
  } catch (error) {
    console.error('Error checking existing review:', error);
    return false;
  }
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;