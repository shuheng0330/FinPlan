const express = require('express');
const investmentController = require('./../controllers/investment-strategyController');

const router = express.Router();


// router.post('/',investmentController.createGoal);
router.post('/generate', investmentController.generateInvestmentStrategy);

router.post('/download-pdf', investmentController.downloadStrategyPdf); 

router.post('/save',investmentController.saveInvestmentStrategy );

router.get('/past-strategies', investmentController.getPastStrategies);


module.exports = router;