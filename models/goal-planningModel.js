const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        goalName: {
            type: String,
            required: [true, 'A saving goal must have a name'],
            unique: true, // Ensures no two goals have the exact same name
            trim: true
        },
        goalAmount: {
            type: Number,
            required: [true, 'A saving goal must have a target amount'],
            min: [1, 'Target amount must be above 1.0'] // Target amount must be at least 1
        },
        currentAmount: {
            type: Number,
            default: 0,
            min: [0, 'Current amount cannot be negative'] // Current amount cannot be negative
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0 // Default progress is 0
        },
        targetDate: {
            type: Date,
            required: [true, 'A saving goal must have a target date']
        },
        startDate: {
            type: Date,
            required: [true, 'A saving goal must have a start date'],
            default: Date.now // Default to the current date when created
        },
        goalPriority: {
            type: String,
            required: [true, 'A saving goal must have a priority level'],
            enum: {
                values: ['High', 'Medium', 'Low'],
                message: 'Priority can be high, medium, or low'
            }
        },
        icon: {
            type: String,
            required: [true, 'A saving goal must have an icon'],
            trim: true
        },
        status: {
            type: String,
            enum: {
                values: ['expired', 'in-progress', 'completed'],
                message: 'Status can be expired, in-progress, or completed'
            },
            default: 'in-progress'
        },
        // You might consider adding a 'user' field if you have authentication
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A goal must belong to a user']
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        toJSON: { virtuals: true }, // Include virtuals when converting to JSON
        toObject: { virtuals: true } // Include virtuals when converting to Object
    }
);


// 1. Pre-validation hook to ensure currentAmount <= goalAmount and startDate <= targetDate
goalSchema.pre('validate', function(next) {
    if (this.currentAmount > this.goalAmount) {
        // Invalidate the 'currentAmount' field if it exceeds 'goalAmount'
        this.invalidate('currentAmount', 'Current savings cannot exceed the target amount.', this.currentAmount);
    }

    // Ensure targetDate is not before startDate
    if (this.startDate && this.targetDate && this.startDate > this.targetDate) {
        this.invalidate('targetDate', 'Target Date cannot be before Start Date.', this.targetDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (this.targetDate && this.targetDate < tomorrow) {
        this.invalidate('targetDate', 'Target Date must be at least one day in the future.', this.targetDate);
    }

    next(); 
});

// 2. Pre-save hook to calculate progress and update status BEFORE saving
goalSchema.pre('save', function(next) {
    // Calculate progress (using Math.min to cap at 100%)
    if (this.goalAmount > 0) {
        this.progress = Math.min(100, Math.round((this.currentAmount / this.goalAmount) * 100));
    } else {
        this.progress = 0; 
    }

    if (this.progress >= 100) {
        this.status = 'completed';
    } else if (this.targetDate && new Date() > this.targetDate) {
        this.status = 'expired';
    } else {
        this.status = 'in-progress';
    }

    
    next(); // Continue with saving
});

// Virtual for short-term/long-term (optional, but good for display)
// This is read-only and not stored in the database.
goalSchema.virtual('term').get(function() {
    if (!this.startDate || !this.targetDate) return undefined;

    const startYear = this.startDate.getFullYear();
    const targetYear = this.targetDate.getFullYear();
    const diffYears = targetYear - startYear;

    // More accurate calculation considering months/days could be done here if needed
    // For now, sticking to simple year difference as per your EJS logic
    return diffYears <= 2 ? 'Short-term (≤ 2 years)' : 'Long-term (> 2 years)';
});

goalSchema.virtual('transactions', {
  ref: 'Transaction',
  foreignField: 'goal',
  localField: '_id'
});

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;