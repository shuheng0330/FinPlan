const express = require('express');
const goalRouter = require('./routers/goal-PlanningRoute');
const goalDetailsRouter = require('./routers/goal-detailsRoute');
const investmentRouter = require('./routers/investmentRoute');
const viewRouter = require('./routers/viewRoute');
const Goal = require("./models/goal-planningModel");
const app = express();
const path = require('path');

app.use(express.json());
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(express.static(path.join(__dirname,'public')));


app.use('/goal-planning', goalRouter);
app.use('/investment-strategy',investmentRouter);
app.use('/goal-details', goalDetailsRouter);
app.use('/',viewRouter);



const marketRouter = require('./routers/marketRouter')
app.use('/market', marketRouter);


module.exports = app; 