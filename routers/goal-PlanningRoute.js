const express = require('express');
const goalPlanningController = require('./../controllers/goal-planningController');

const router = express.Router();
router
   .route('/')
   .get(goalPlanningController.getAllGoals)
   .post(goalPlanningController.createGoal);



router
  .route('/:id')
  .get(goalPlanningController.getGoal)
  .put(goalPlanningController.updateGoal)
  .delete(goalPlanningController.deleteGoal);


module.exports = router;
