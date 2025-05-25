const express = require('express');
const goalPlanningController = require('./../controllers/goal-planningController');

const router = express.Router();
router
   .route('/')
   .get(goalPlanningController.getAllGoals)
   .post(goalPlanningController.createGoal);

// router
//   .route('/:id')
//   .get(goalPlanningController.getGoal)
//   .patch(goalPlanningController.updateGoal)
//   .delete(goalPlanningController.deleteGoal);


router.post('/', async (req, res) => {
    try {
        // Server-side validation
        const { goalName, goalAmount, currentAmount, targetDate, startDate, goalPriority, icon } = req.body;

        // Mongoose Schema validation will handle most 'required' and 'min' checks.
        // We'll add custom logical checks here.

        // Ensure date formats are valid before creating Date objects for comparison
        if (!targetDate || !startDate) {
            return res.status(400).json({ message: 'Start Date and Target Date are required.' });
        }

        const parsedStartDate = new Date(startDate);
        const parsedTargetDate = new Date(targetDate);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedTargetDate.getTime())) {
            return res.status(400).json({ message: 'Invalid Start Date or Target Date format.' });
        }

        // The Mongoose pre('validate') hook will handle:
        // - currentAmount > goalAmount
        // - startDate > targetDate
        // So you don't *strictly* need to repeat these here, but it's good for immediate feedback.
        if (currentAmount > goalAmount) {
            return res.status(400).json({ message: 'Current Savings cannot be greater than Target Amount.' });
        }
        if (parsedStartDate > parsedTargetDate) {
            return res.status(400).json({ message: 'Start Date cannot be after Target Date.' });
        }


        // Ensure the icon is one of your allowed icons (important for data consistency)
        const allowedIcons = [
            'vacation', 'house', 'emergency', 'car', 'education', 'investment',
            'retirement', 'wedding', 'family', 'electronic', 'debt', 'charity'
        ];
        if (!allowedIcons.includes(icon)) {
            return res.status(400).json({ message: `Invalid icon selected. Allowed icons are: ${allowedIcons.join(', ')}.` });
        }

        // Create a new goal instance
        // Mongoose will handle casting types and applying defaults from the schema
        const newGoal = new Goal({
            goalName,
            goalAmount,
            currentAmount,
            targetDate: parsedTargetDate, // Use parsed Date objects
            startDate: parsedStartDate,   // Use parsed Date objects
            goalPriority,
            icon
            // If you have user authentication, you'd typically set the userId here:
            // user: req.user.id // Assuming req.user is populated by authentication middleware
        });

        // Save the goal to the database
        const savedGoal = await newGoal.save(); // This will trigger the pre('validate') and pre('save') hooks

        res.status(201).json({
            status: 'success',
            message: 'Goal added successfully!',
            data: {
                goal: savedGoal // Send back the saved goal data
            }
        });

    } catch (error) {
        console.error('Error saving goal:', error);

        // Handle specific Mongoose errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: 'Validation failed', errors: messages });
        } else if (error.code === 11000) { // Duplicate key error (for unique: true on goalName)
            return res.status(409).json({ status: 'fail', message: 'A goal with this name already exists. Please choose a different name.' });
        }

        // Generic error response
        res.status(500).json({
            status: 'error',
            message: 'Failed to save goal',
            error: error.message
        });
    }
});

module.exports = router;
