const express = require('express');
const goalPlanningController = require('./../controllers/goal-planningController');

const router = express.Router();
router
   .route('/')
   .post(goalPlanningController.createGoal);



// router
//   .route('/:id')
//   .get(goalPlanningController.getGoal)
//   .patch(goalPlanningController.updateGoal)
//   .delete(goalPlanningController.deleteGoal);


module.exports = router;
