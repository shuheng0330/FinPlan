const mongoose = require("mongoose");

const strategySchema = new mongoose.Schema(
    {
        goal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Goal",
            required: [true, "Strategy must be linked to a goal"],
        },
        
        assetAllocation: [
            {
                assetClass:{ type: String, required: true},
                percentage: { type: Number, required: true}
            }
        ],

        recommendedFunds: [
            {
                fundName:{ type: String, required: true},
                description:{ type: String}
            }
        ],

        suggestedMonthlyInvestment: { type: Number, required: true},
        expectedAnnualReturn: { type: Number, required: true},
        investmentHorizon: {type: String, required: true},
        riskLevel: {
            type: String,
            enum: ["Conservative", "Moderate", "Aggressive"],
            required: true
        },
        strategyExplanation: {
            whyThisStrategy: { type: String},
            riskReturnAnalysis: { type: String},
            investmentHorizonImpact: {type: String}
        },
        chartImage: { type: String}, 
        createdAt: { type: Date, default: Date.now}
    }
);

module.exports = mongoose.model("Strategy",strategySchema);