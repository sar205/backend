const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    city: String,
    state: String,
    category: String,
    keyword: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
    likes: {
        type: Number,
        default: 0,
    },
});

const News = mongoose.model('News', newsSchema);
module.exports = News;