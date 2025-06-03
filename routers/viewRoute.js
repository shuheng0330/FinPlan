const express = require('express');
const router = express.Router();
const goalPlanningController = require('../controllers/goal-planningController');
const investmentController = require('../controllers/investment-strategyController');



router.get('/',(req,res)=>{
res.render('login', {title: "FinPlan - Login"});
});

router.get('/register',(req,res)=>{
    res.render('register', {title: "FinPlan - Register"});
});


router.get('/dashboard',(req,res)=>{
    res.render('dashboard', {
        title:'FinPlan - Dashboard',
        username: "Thong Shu Heng",
        userEmail: "thongshuheng0330@gmail.com",
        pageTitle: "Dashboard"
    })
});

router.get('/profile',(req,res)=>{
    res.render('profile',{
        title: "FinPlan - Profile",
        username: "Thong Shu Heng",
        userEmail: "thongshuheng0330@gmail.com",
        pageTitle: "Personal Profile"
    })
});



router.get('/investment-strategy',investmentController.renderStrategypage);


router.get("/goal-details", (req, res) => {
  res.render("goal-details", {
    title: "FinPlan - Goal Details",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Goal Details",
  })
});

router.get("/market", (req, res) => {
  res.render("market", {
    title: "FinPlan - Market Insights",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Market Insights",
  })
});


router.get("/roi-calculator", (req, res) => {
  res.render("roi-calculator", {
    title: "FinPlan - ROI Calculator",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Investment ROI",
  })
});



module.exports = router;