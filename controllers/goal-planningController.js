const Goal = require('./../models/goal-planningModel');

exports.getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.find(); 
    res.status(200).json({
      status: 'success',
      results: goals.length,
      data: {
        goals
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.createGoal = async (req,res) =>{
    
    try{
        const {
            goalName,
            goalAmount,
            currentAmount,
            progress,
            targetDate,
            startDate,
            goalPriority,
            icon
        } = req.body;

    const newGoal = await Goal.create({
      goalName,
      goalAmount,
      currentAmount,
      progress,
      targetDate,
      startDate,
      goalPriority,
      icon
    });

    res.status(201).json({
      status: 'success',
      data: newGoal
    });
    }
    catch(err){
      res.status(500).json({
      status: 'error',
      message: err.message
    });
    }
};

