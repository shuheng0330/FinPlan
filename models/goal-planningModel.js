const mongoose = require('mongoose'); 

const goalSchema = new mongoose.Schema(
    {
        goalName: {
            type: String,
            required: [true, 'A saving goal must have a name'],
            unique: true,
            trim: true
        },
        goalAmount : {
            type: Number,
            required: [true, 'A saving goal must have a target amount'],
            min: [1, 'Target amount must be above 1.0']
        },
        currentAmount : {
            type: Number,
            default: 0
        },
        progress: {
            type: Number,
        },
        targetDate :{
            type: Date,
            required: [true, 'A saving goal must have a target date']
        },
        startDate :{
            type: Date,
            required: [true, 'A saving goal must have a start date']
        },
        goalPriority :{
            type: String
        },
        icon: {
            type: String,
        },
        status: {
            type: String,
            enum: ['expired', 'in-progress', 'completed'],
            default: 'in-progress'
        },
    },
        {
        timestamps: true
        }
);

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;