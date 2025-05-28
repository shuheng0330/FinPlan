const Goal = require('./../models/goal-planningModel');

exports.getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.find();
    res.render("goal-planning", {
      title: "FinPlan - Goal Planning",
      username: "Thong Shu Heng",
      userEmail: "thongshuheng030@gmail.com",
      pageTitle: "Financial Goals",
      goals: goals
    });
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.render("goal-planning", {
      title: "FinPlan - Goal Planning",
      username: "Thong Shu Heng",
      userEmail: "thongshuheng030@gmail.com",
      pageTitle: "Financial Goals",
      goals: [] // fallback
    });
  }
};


// exports.createGoal = async (req,res) =>{
    
//     try{
//         const {
//             goalName,
//             goalAmount,
//             currentAmount,
//             progress,
//             targetDate,
//             startDate,
//             goalPriority,
//             icon
//         } = req.body;

//     const newGoal = await Goal.create({
//       goalName,
//       goalAmount,
//       currentAmount,
//       progress,
//       targetDate,
//       startDate,
//       goalPriority,
//       icon
//     });

//     res.status(201).json({
//       status: 'success',
//       data: newGoal
//     });
//     }
//     catch(err){
//       res.status(500).json({
//       status: 'error',
//       message: err.message
//     });
//     }
// };

//can use mine one

