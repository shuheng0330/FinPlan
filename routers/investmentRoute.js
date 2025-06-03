const express = require('express');
const investmentController = require('./../controllers/investment-strategyController');

const router = express.Router();


// router.post('/',investmentController.createGoal);
router.post('/generate', investmentController.generateInvestmentStrategy);

router.post('/download-pdf', investmentController.downloadStrategyPdf); 


module.exports = router;