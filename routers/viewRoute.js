const express = require('express');
const router = express.Router();
const goalPlanningController = require('../controllers/goal-planningController');
const investmentController = require('../controllers/investment-strategyController');
const dashboardController = require('../controllers/dashboardController');


router.get('/', (req, res) => {
  res.render('login', { title: "FinPlan - Login" });
});

router.get('/register', (req, res) => {
  res.render('register', { title: "FinPlan - Register" });
});


router.get('/dashboard',dashboardController.renderDashboardPage);

router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render('profile', {
    title: "FinPlan - Profile",
    pageTitle: "Personal Profile",
    user: req.user
  });
});

router.get("/goal-planning", (req, res, next) => { 
    if (!req.isAuthenticated()) return res.redirect('/users/login'); 
    goalPlanningController.getAllGoals(req, res, next); 
});

router.get('/investment-strategy', (req, res, next) => { 
    if (!req.isAuthenticated()) return res.redirect('/users/login'); 
    investmentController.renderStrategypage(req, res, next);
    
});

router.get("/goal-details", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render("goal-details", {
    title: "FinPlan - Goal Details",
    pageTitle: "Goal Details",
    user: req.user
  });
});

router.get("/market", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render("market", {
    title: "FinPlan - Market Insights",
    pageTitle: "Market Insights",
    user: req.user
  });
});

router.get("/roi-calculator", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render("roi-calculator", {
    title: "FinPlan - ROI Calculator",
    pageTitle: "Investment ROI",
    user: req.user
  });
});


module.exports = router;