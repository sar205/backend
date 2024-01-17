const mongoose = require('mongoose');

// Create a Category schema
const categorySchema = new mongoose.Schema({
  name: String,
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
