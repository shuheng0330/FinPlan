const Strategy = require('../models/StrategyModel');
const Goal = require('../models/goal-planningModel');

exports.renderDashboardPage = async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/');

    const userId = req.user ? req.user._id : null;
    let pastStrategies = [];
    let nearestGoals = [];

    if (userId) {
      // Get past strategies
      pastStrategies = await Strategy.find({ user: userId })
        .populate('goal') // Populate goal to get its details
        .sort({ createdAt: -1 }) // Newest first
        .limit(2);

      // Get 2 nearest goals by targetDate
      nearestGoals = await Goal.find({ user: userId })
        .sort({ targetDate: 1 }) // Ascending: soonest deadline first
        .limit(2);
    }

    res.render('dashboard', {
      title: 'FinPlan - Dashboard',
      pageTitle: 'Dashboard',
      user: req.user,
      pastStrategies: pastStrategies,
      nearestGoals: nearestGoals
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).render("dashboard", {
      title: 'FinPlan - Dashboard',
      pageTitle: 'Dashboard',
      pastStrategies: [],
      nearestGoals: []
    });
  }
};
