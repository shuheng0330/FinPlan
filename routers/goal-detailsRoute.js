const express = require('express');
const goalDetailsController = require('./../controllers/goal-detailsController');

const router = express.Router();
router
   .route('/:id')
   .get(goalDetailsController.getGoalsDetails)
   .post(goalDetailsController.createTransaction);

router
    .route('/transactions/:id')
    .delete(goalDetailsController.deleteTransaction)

module.exports = router;
