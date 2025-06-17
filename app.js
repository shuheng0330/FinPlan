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
const watchlistRouter = require('./routers/watchlistRoute'); 


app.get('/api/quote/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${process.env.FMP_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.get('/api/news/top-headlines', async (req, res) => {
  const { category, language, pageSize } = req.query;

  const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=${language}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.get('/api/fmp/historical-price-full/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${process.env.FMP_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data from FMP' });
  }
});


app.get('/api/historical-price-full/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const { from, to } = req.query;
  
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${process.env.FMP_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});


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
app.use('/api', watchlistRouter); 

module.exports = app;