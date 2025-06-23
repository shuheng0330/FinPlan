const Goal = require('./../models/goal-planningModel');

exports.getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.find({user: req.user._id});

    const today = new Date();
    for (const goal of goals) {
      if (goal.status !== 'completed' && goal.targetDate < today) {
        goal.status = 'expired';
         await goal.save({ validateBeforeSave: false }); // Triggers pre-save hook to recalculate progress and status
      }
    }

    res.render("goal-planning", {
      title: "FinPlan - Goal Planning",
      pageTitle: "Financial Goals",
      goals: goals
    });
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.render("goal-planning", {
      title: "FinPlan - Goal Planning",
      pageTitle: "Financial Goals",
      goals: [] // fallback
    });
  }
};

exports.createGoal = async(req,res)=>{
        try {
        // Server-side validation
        const { goalName, goalAmount, currentAmount, targetDate, startDate, goalPriority, icon } = req.body;
        console.log("goalPriority received:", req.body.goalPriority);


        if (!req.user || !req.user._id){
            return res.status(400).json({ message: 'User must be logged in to create new goal' });
        }
        // Ensure date formats are valid before creating Date objects for comparison
        if (!targetDate || !startDate) {
            return res.status(400).json({ message: 'Start Date and Target Date are required.' });
        }

        const parsedStartDate = new Date(startDate);
        const parsedTargetDate = new Date(targetDate);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedTargetDate.getTime())) {
            return res.status(400).json({ message: 'Invalid Start Date or Target Date format.' });
        }

        if (currentAmount > goalAmount) {
            return res.status(400).json({ message: 'Current Savings cannot be greater than Target Amount.' });
        }
        if (parsedStartDate > parsedTargetDate) {
            return res.status(400).json({ message: 'Start Date cannot be after Target Date.' });
        }


        const allowedIcons = [
            'vacation', 'house', 'emergency', 'car', 'education', 'investment',
            'retirement', 'wedding', 'family', 'electronic', 'debt', 'charity'
        ];
        if (!allowedIcons.includes(icon)) {
            return res.status(400).json({ message: `Invalid icon selected. Allowed icons are: ${allowedIcons.join(', ')}.` });
        }

        // Create a new goal instance
        const newGoal = new Goal({
            goalName,
            goalAmount,
            currentAmount,
            targetDate: parsedTargetDate, // Use parsed Date objects
            startDate: parsedStartDate,   // Use parsed Date objects
            goalPriority,
            icon,
            user: req.user.id 
        });

        // Save the goal to the database
        const savedGoal = await newGoal.save(); 

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
  };

  exports.deleteGoal = async (req, res) => {
    try {
        const goalId = req.params.id;

        // Validate the goal ID format
        if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid goal ID format.' });
        }

        // Try to find and delete the goal
        const deletedGoal = await Goal.findByIdAndDelete(goalId);

        if (!deletedGoal) {
            return res.status(404).json({ status: 'fail', message: 'Goal not found.' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Goal deleted successfully.',
            data: {
                goal: deletedGoal
            }
        });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete goal',
            error: error.message
        });
    }
};

exports.getGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        goal
      }
    });
  } catch (err) {
    console.error('Error fetching goal by ID:', err);
    res.status(500).json({ message: 'Error retrieving goal', error: err.message });
  }
};

exports.updateGoal = async (req, res) => {
    try {
        const goalId = req.params.id;
        const { goalName, goalAmount, currentAmount, targetDate, startDate, goalPriority, icon } = req.body;

    

        if (!goalName || !goalAmount || !targetDate || !startDate || !icon) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        if (currentAmount > goalAmount) {
            return res.status(400).json({ message: 'Current savings cannot be greater than the goal amount.' });
        }

        const parsedStartDate = new Date(startDate);
        const parsedTargetDate = new Date(targetDate);

        if (parsedStartDate > parsedTargetDate) {
            return res.status(400).json({ message: 'Start Date cannot be after Target Date.' });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (parsedTargetDate < tomorrow) {
        return res.status(400).json({ message: 'Target Date must be at least one day in the future.' });
        }

        const allowedIcons = [
            'vacation', 'house', 'emergency', 'car', 'education', 'investment',
            'retirement', 'wedding', 'family', 'electronic', 'debt', 'charity'
        ];

        if (!allowedIcons.includes(icon)) {
            return res.status(400).json({ message: `Invalid icon. Allowed icons: ${allowedIcons.join(', ')}` });
        }

        const progress = Math.min(100, Math.round((currentAmount / goalAmount) * 100));
        let status = 'in-progress';
        if (progress >= 100) {
            status = 'completed';
        } else if (parsedTargetDate < new Date()) {
            status = 'expired';
        }

        const updatedGoal = await Goal.findByIdAndUpdate(
            goalId,
            {
                goalName,
                goalAmount,
                currentAmount,
                progress,
                targetDate: parsedTargetDate,
                startDate: parsedStartDate,
                goalPriority,
                icon,
                status
            },
            { new: true, runValidators: true }
        );

        if (!updatedGoal) {
            return res.status(404).json({ message: 'Goal not found.' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Goal updated successfully.',
            data: {
                goal: updatedGoal
            }
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update goal', error: error.message });
    }
};

