const express = require('express');
const goalRouter = require('./routers/goal-PlanningRoute');
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
app.use('/',viewRouter);



module.exports = app; 