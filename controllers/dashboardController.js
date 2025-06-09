const Strategy = require('../models/StrategyModel');

exports.renderDashboardPage = async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.redirect('/');

        const userId = req.user ? req.user._id : null;
        let pastStrategies = [];
        if (userId) {
            pastStrategies = await Strategy.find({ user: userId })
                                            .populate('goal') // Populate the goal to get goal name
                                            .sort({ createdAt: -1 }) // Newest first
                                            .limit(2); // Get only the two most recent strategies for dashboard
        }

       res.render('dashboard', {
       title: 'FinPlan - Dashboard',
       pageTitle: "Dashboard",
       user: req.user,
       pastStrategies: pastStrategies // Pass the fetched strategies to dashboard.ejs
    });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).render("dashboard", {
            title: 'FinPlan - Dashboard',
            pageTitle: "Dashboard",
            pastStrategies: [] // Ensure an empty array on error
        });
    }
};