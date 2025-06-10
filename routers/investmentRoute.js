const express = require('express');
const investmentController = require('./../controllers/investment-strategyController');
const goalPlanningController = require('./../controllers/goal-planningController');


const router = express.Router();


router.post('/',goalPlanningController.createGoal);
router.post('/generate', investmentController.generateInvestmentStrategy);

router.post('/download-pdf', investmentController.downloadStrategyPdf); 

router.post('/save',investmentController.saveInvestmentStrategy );

router.get('/past-strategies', investmentController.getPastStrategies);


module.exports = router;