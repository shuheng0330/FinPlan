require('dotenv').config();
const express = require('express');
const Goal = require("./models/goal-planningModel");
const path = require('path');
const session = require('express-session');
const User = require('./models/userModel');
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
const marketRouter = require('./routers/marketRouter')

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // true only with HTTPS
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to check authentication and populate res.locals
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        res.locals.username = req.user.username;
        res.locals.userEmail = req.user.email;
        res.locals.profilePicture = req.user.profilePicture;
    } else {
        res.locals.user = null;
        res.locals.username = null;
        res.locals.userEmail = null;
        res.locals.profilePicture = null;
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("public/uploads"));

app.use('/goal-planning', goalRouter);
app.use('/investment-strategy',investmentRouter);
app.use('/goal-details', goalDetailsRouter);
app.use('/',viewRouter);
app.use('/users', userRouter);
app.use('/', dashboardRouter);
app.use('/users', authRoutes);
app.use('/market', marketRouter); 

module.exports = app;