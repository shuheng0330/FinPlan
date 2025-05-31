const Goal = require('../models/goal-planningModel');

exports.renderStrategypage = async(req,res)=>{
    try{
        const goals = await Goal.find();

        res.render("investment-strategy",{
            title:"FinPlan - Investment Strategy",
            username: "Thong Shu Heng",
            userEmail: "thongshuheng030@gmail.com",
            pageTitle: "Investment Strategy",
            goals: goals, // Pass to EJS
        });
    } catch (err) {
        console.error("Error fetching goals:", err);
        res.render("investment-strategy", {
            title: "FinPlan - Investment Strategy",
            username: "Thong Shu Heng",
            userEmail: "thongshuheng030@gmail.com",
            pageTitle: "Investment Strategy",
            goals: [], // Fallback to empty
    });
  }
};

