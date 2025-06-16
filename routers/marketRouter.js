// routes/marketRouter.js
const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist'); // Import the simplified Watchlist model

// Default stocks for the global watchlist if it doesn't exist
const GLOBAL_DEFAULT_STOCKS = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'];

// Helper to get or create the global watchlist document
async function getGlobalWatchlist() {
    let globalWatchlist = await Watchlist.findOne({}); // Find any single watchlist document

    if (!globalWatchlist) {
        // If no watchlist exists, create one with default stocks
        globalWatchlist = new Watchlist({ stocks: GLOBAL_DEFAULT_STOCKS });
        await globalWatchlist.save();
        console.log('DEBUG: Created initial global watchlist with default stocks.');
    }
    return globalWatchlist;
}

// Main Market Dashboard Route
router.get('/', async (req, res) => {
    try {
        const globalWatchlistDoc = await getGlobalWatchlist();
        res.render('market', {
            title: 'FinPlan - Market Dashboard',
            username: req.user ? req.user.username : 'Guest',
            userEmail: req.user ? req.user.email : 'guest@example.com',
            pageTitle: 'Market Overview',
            currentUserWatchlist: globalWatchlistDoc.stocks
        });
    } catch (error) {
        console.error('Error fetching global watchlist for EJS rendering:', error);
        res.status(500).render('error', { message: 'Failed to load market dashboard.' });
    }
});

// NEW ROUTE: API to get the current global watchlist
// This route now corresponds to GET /market/watchlist/get
router.get('/watchlist/get', async (req, res) => {
    try {
        const globalWatchlist = await getGlobalWatchlist();
        return res.json({ stocks: globalWatchlist.stocks });
    } catch (error) {
        console.error('Error fetching global watchlist via API:', error);
        res.status(500).json({ message: 'Server error: Failed to retrieve watchlist.' });
    }
});


// API Route to Add Stock to Global Watchlist
router.post('/watchlist/add', async (req, res) => {
    const { stockSymbol } = req.body; 
    
    if (!stockSymbol) {
        return res.status(400).json({ message: 'Stock symbol is required.' });
    }

    try {
        const globalWatchlist = await getGlobalWatchlist();
        const upperSymbol = stockSymbol.toUpperCase();

        if (globalWatchlist.stocks.includes(upperSymbol)) {
            return res.status(409).json({
                message: `${upperSymbol} is already in the global watchlist.`,
                stocks: globalWatchlist.stocks
            });
        }

        globalWatchlist.stocks.push(upperSymbol);
        globalWatchlist.lastModified = new Date();
        await globalWatchlist.save();

        console.log(`DEBUG: Added ${upperSymbol} to global watchlist.`);
        return res.json({
            message: `${upperSymbol} added to watchlist successfully!`,
            stocks: globalWatchlist.stocks
        });

    } catch (error) {
        console.error('Error adding stock to global watchlist in DB:', error);
        res.status(500).json({ message: 'Server error: Failed to add stock to watchlist.' });
    }
});

// API Route to Remove Stock from Global Watchlist
router.post('/watchlist/remove', async (req, res) => {
    const { stockSymbol } = req.body;

    if (!stockSymbol) {
        return res.status(400).json({ message: 'Stock symbol is required.' });
    }

    try {
        const globalWatchlist = await getGlobalWatchlist();
        const upperSymbol = stockSymbol.toUpperCase();

        const initialLength = globalWatchlist.stocks.length;
        globalWatchlist.stocks = globalWatchlist.stocks.filter((symbol) => symbol !== upperSymbol);

        if (globalWatchlist.stocks.length === initialLength) {
            return res.status(404).json({
                message: `${upperSymbol} was not found in the global watchlist.`,
                stocks: globalWatchlist.stocks
            });
        }

        globalWatchlist.lastModified = new Date();
        await globalWatchlist.save();

        console.log(`DEBUG: Removed ${upperSymbol} from global watchlist.`);
        return res.json({
            message: `${upperSymbol} removed from watchlist successfully!`,
            stocks: globalWatchlist.stocks
        });

    } catch (error) {
        console.error('Error removing stock from global watchlist in DB:', error);
        res.status(500).json({ message: 'Server error: Failed to remove stock from watchlist.' });
    }
});

// Placeholder routes for "See All" pages
router.get('/all', (req, res) => {
    res.render('all-stocks', {
        title: 'FinPlan - All Stocks',
        username: req.user ? req.user.username : 'Guest',
        userEmail: req.user ? req.user.email : 'guest@example.com',
        pageTitle: 'All Stocks'
    });
});

router.get('/news', (req, res) => {
    res.render('market-news', {
        title: 'FinPlan - Market News',
        username: req.user ? req.user.username : 'Guest',
        userEmail: req.user ? req.user.email : 'guest@example.com',
        pageTitle: 'Market News'
    });
});

router.get('/analysis', (req, res) => {
    res.render('market-analysis', {
        title: 'FinPlan - Market Analysis',
        username: req.user ? req.user.username : 'Guest',
        userEmail: req.user ? req.user.email : 'guest@example.com',
        pageTitle: 'Market Analysis'
    });
});

module.exports = router;
