const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
