const mongoose = require('mongoose');
const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  stocks: [String]
});
module.exports = mongoose.model('Watchlist', watchlistSchema);