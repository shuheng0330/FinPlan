// routes/marketRouter.js
const express = require('express');
const router = express.Router();

// Placeholder route for "See All" in Stock Watchlist
router.get('/all', (req, res) => {
  res.render('all-stocks', {
    title: 'FinPlan - All Stocks',
    username: 'Thong Shu Heng',
    userEmail: 'thongshuheng030@gmail.com',
    pageTitle: 'All Stocks'
  });
});

// Placeholder route for "See All" in Market News
router.get('/news', (req, res) => {
  res.render('market-news', {
    title: 'FinPlan - Market News',
    username: 'Thong Shu Heng',
    userEmail: 'thongshuheng030@gmail.com',
    pageTitle: 'Market News'
  });
});

// Placeholder route for "See All" in Stock Analysis
router.get('/analysis', (req, res) => {
  res.render('market-analysis', {
    title: 'FinPlan - Market Analysis',
    username: 'Thong Shu Heng',
    userEmail: 'thongshuheng030@gmail.com',
    pageTitle: 'Market Analysis'
  });
});

// Route for "Add Stock" (POST request to handle form submission)
router.post('/add-stock', (req, res) => {
  const { symbol } = req.body; // Assuming a form sends the stock symbol
  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }
  // For now, just send a success message (you can expand this later)
  res.json({ message: `Stock ${symbol.toUpperCase()} added successfully!` });
});

module.exports = router;