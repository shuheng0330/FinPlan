const express = require('express');
const goalPlanningController = require('./../controllers/goal-planningController');
const investmentController = require('../controllers/investment-strategyController')

const router = express.Router();
router
   .route('/')
   .post(investmentController.createGoal);



// router
//   .route('/:id')
//   .get(goalPlanningController.getGoal)
//   .patch(goalPlanningController.updateGoal)
//   .delete(goalPlanningController.deleteGoal);


module.exports = router;
