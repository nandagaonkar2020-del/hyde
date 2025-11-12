const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  actualPrice: { type: Number, required: true },
  offerPrice: { type: Number, default: 0 },
  images: [String], // multiple Cloudinary URLs
  category: {
    type: String,
    enum: ['Jackets', 'Wallets', 'Belts'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
