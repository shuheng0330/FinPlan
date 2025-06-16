const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    stocks: {
        type: [String], 
        default: [],    
        required: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});



const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;