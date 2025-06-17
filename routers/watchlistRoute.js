const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

// GET /api/watchlist
router.get('/watchlist', ensureAuthenticated, async (req, res) => {
  try {
    console.log(`DEBUG: Fetching watchlist for user: ${req.user._id}`);
    let watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (!watchlist) {
      // Initialize with default stocks
      console.log('DEBUG: No watchlist found, initializing with defaults');
      watchlist = new Watchlist({
        userId: req.user._id,
        stocks: ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'MSFT']
      });
      await watchlist.save();
    }
    res.json(watchlist.stocks);
  } catch (error) {
    console.error('DEBUG: Error fetching watchlist:', error);
    res.status(500).json([]);
  }
});

// POST /api/watchlist/add
router.post('/watchlist/add', ensureAuthenticated, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
    console.log(`DEBUG: Adding stock ${symbol} for user: ${req.user._id}`);
    let watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (!watchlist) {
      watchlist = new Watchlist({ userId: req.user._id, stocks: [] });
    }
    if (!watchlist.stocks.includes(symbol.toUpperCase())) {
      watchlist.stocks.push(symbol.toUpperCase());
      await watchlist.save();
    }
    res.json(watchlist.stocks);
  } catch (error) {
    console.error('DEBUG: Error adding stock:', error);
    res.status(500).json([]);
  }
});

// DELETE /api/watchlist/delete/:symbol
router.delete('/watchlist/delete/:symbol', ensureAuthenticated, async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`DEBUG: Deleting stock ${symbol} for user: ${req.user._id}`);
    const watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (watchlist) {
      watchlist.stocks = watchlist.stocks.filter(s => s !== symbol.toUpperCase());
      await watchlist.save();
    }
    res.json(watchlist ? watchlist.stocks : []);
  } catch(error) {
    console.error('DEBUG: Error deleting stock:', error);
    res.status(500).json([]);
  }
});

module.exports = router;