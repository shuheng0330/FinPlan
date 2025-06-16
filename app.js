// app.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
require('./config/passport');

const app = express();

const goalRouter = require('./routers/goal-PlanningRoute');
const goalDetailsRouter = require('./routers/goal-detailsRoute');
const investmentRouter = require('./routers/investmentRoute');
const viewRouter = require('./routers/viewRoute');
const userRouter = require('./routers/userRoute');
const dashboardRouter = require('./routers/dashboardRoute');
const authRoutes = require('./routers/authRoutes');
const marketRouter = require('./routers/marketRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-default-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE || 'mongodb://localhost:27017/finplan' }),
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.use(async (req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        res.locals.username = req.user.username;
        res.locals.userEmail = req.user.email;
        res.locals.profilePicture = req.user.profilePicture;
        res.locals.currentUserWatchlist = []; 
    } else {
        res.locals.user = null;
        res.locals.username = null;
        res.locals.userEmail = null;
        res.locals.profilePicture = null;
        res.locals.currentUserWatchlist = [];
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("public/uploads"));

app.use('/', viewRouter);
app.use('/goal-planning', goalRouter);
app.use('/investment-strategy', investmentRouter);
app.use('/goal-details', goalDetailsRouter);
app.use('/users', userRouter);
app.use('/dashboard', dashboardRouter);
app.use('/auth', authRoutes);
app.use('/market', marketRouter);

module.exports = app;