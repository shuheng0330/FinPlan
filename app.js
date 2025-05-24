const express = require('express');
const goalRouter = require('./routers/goal-PlanningRoute');
const app = express();
const path = require('path');

app.use(express.json());
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res)=>{
res.render('login', {title: "FinPlan - Login"});
});

app.get('/register',(req,res)=>{
    res.render('register', {title: "FinPlan - Register"});
});

app.get('/dashboard',(req,res)=>{
    res.render('dashboard', {
        title:'FinPlan - Dashboard',
        username: "Thong Shu Heng",
        userEmail: "thongshuheng0330@gmail.com",
        pageTitle: "Dashboard"
    })
});

app.get('/profile',(req,res)=>{
    res.render('profile',{
        title: "FinPlan - Profile",
        username: "Thong Shu Heng",
        userEmail: "thongshuheng0330@gmail.com",
        pageTitle: "Personal Profile"
    })
});


 app.get("/goal-planning", (req, res) => {
  res.render("goal-planning", {
    title: "FinPlan - Goal Planning",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
     pageTitle: "Financial Goals",
  })
 });

app.use('/api/v1/goals', goalRouter);

app.get("/goal-details", (req, res) => {
  res.render("goal-details", {
    title: "FinPlan - Goal Details",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Goal Details",
  })
});

app.get("/investment-strategy", (req, res) => {
  res.render("investment-strategy", {
    title: "FinPlan - Investment Strategy",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Investment Strategy",
  })
});

app.get("/market", (req, res) => {
  res.render("market", {
    title: "FinPlan - Market Insights",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Market Insights",
  })
});

app.get("/roi-calculator", (req, res) => {
  res.render("roi-calculator", {
    title: "FinPlan - ROI Calculator",
    username: "Thong Shu Heng",
    userEmail: "thongshuheng030@gmail.com",
    pageTitle: "Investment ROI",
  })
});

module.exports = app; 