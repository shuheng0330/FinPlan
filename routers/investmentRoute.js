const express = require('express');
const investmentController = require('./../controllers/investment-strategyController');

const router = express.Router();


router.get('/',investmentController.renderStrategypage);

router.post('/',investmentController.createGoal);

module.exports = router;