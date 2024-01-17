const mongoose = require('mongoose')

const adminuserSchema = new mongoose.Schema({
    
    email: String,
    password: String,
});

// Create a User model based on the schema
const User = mongoose.model('adminUser', adminuserSchema);
module.exports = User;
