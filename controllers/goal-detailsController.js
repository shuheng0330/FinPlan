const Transaction = require("./../models/goal-detailsModel");
const Goal = require("./../models/goal-planningModel");

exports.getGoalsDetails = async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId);

    if (!goal) {
      throw new Error("Goal not found");
    }

    const transactions = await Transaction.find({ goal: goal._id }).sort({
      date: -1,
    });

    res.render("goal-details", {
      title: "FinPlan - Goal Planning",
      username: "Thong Shu Heng",
      userEmail: "thongshuheng030@gmail.com",
      pageTitle: "Financial Goals",
      goal: goal,
      transactions: transactions,
      timeRemaining: (targetDateStr) => {
        const targetDate = new Date(targetDateStr);
        const now = new Date();

        let years = targetDate.getFullYear() - now.getFullYear();
        let months = targetDate.getMonth() - now.getMonth();
        let days = targetDate.getDate() - now.getDate();

        if (days < 0) {
          months -= 1;
          // Get days in previous month
          const prevMonth = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            0
          );
          days += prevMonth.getDate();
        }

        if (months < 0) {
          years -= 1;
          months += 12;
        }

        return `${years} year${years !== 1 ? "s" : ""}, ${months} month${
          months !== 1 ? "s" : ""
        }, ${days} day${days !== 1 ? "s" : ""}`;
      },

      goalDuration: (startStr, endStr) => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
          months -= 1;
          const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
          days += prevMonth.getDate();
        }

        if (months < 0) {
          years -= 1;
          months += 12;
        }

        return `${years} year${years !== 1 ? "s" : ""}, 
        ${months} month${ months !== 1 ? "s" : ""
        }, ${days} day${days !== 1 ? "s" : ""}`;
      },
    });
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.render("goal-details", {
      title: "FinPlan - Goal Planning",
      username: "Thong Shu Heng",
      userEmail: "thongshuheng030@gmail.com",
      pageTitle: "Financial Goals",
      goal: null,
      transactions: [],
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { goalId, description, amount, type, date } = req.body;

    // Validate required fields
    if (!goalId || !amount || !type) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // Check if goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    // Ensure amount is positive
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    // Update the goal’s current amount based on transaction type
    if (type === 'deposit') {
      const remainingAmount = goal.goalAmount - goal.currentAmount;
      if (amount > remainingAmount) {
        return res.status(400).json({
          message: `Deposit exceeds goal. You can only deposit up to ${remainingAmount.toFixed(2)}.`
        });
      }
      goal.currentAmount += amount;

      } else if (type === 'withdrawal') {
      if (goal.currentAmount < amount) {
        return res.status(400).json({ message: 'Insufficient goal balance for withdrawal.' });
      }
      goal.currentAmount -= amount;}


    await goal.save();

    // Create the transaction
    const transaction = await Transaction.create({
      goal: goalId,
      description,
      amount,
      type,
      date: date || Date.now()
    });

    res.status(201).json({
      message: 'Transaction created successfully.',
      transaction
    });
  } catch (err) {
    console.error('Error creating transaction:', err);

      if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Find the transaction
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { goal: goalId, amount, type } = transaction;

    // Step 2: Find the related goal
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Related goal not found' });
    }

    // Step 3: Reverse the transaction effect
    if (type === 'deposit') {
      goal.currentAmount -= amount;
    } else if (type === 'withdrawal') {
      goal.currentAmount += amount;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    // Optional: prevent negative goal amount after reversing
    if (goal.currentAmount < 0) goal.currentAmount = 0;

    // Step 4: Save goal and delete transaction
    await goal.save();
    await transaction.deleteOne();

    return res.status(200).json({ success: true, message: 'Transaction deleted and goal updated' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

