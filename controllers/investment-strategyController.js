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



exports.generateInvestmentStrategy = async (req, res, next) => {
    try {
        const { goalId, riskAppetite } = req.body;

        if (!goalId || !riskAppetite) {
            return res.status(400).json({
                status: 'fail',
                message: 'Goal ID and Risk Appetite are required to generate a strategy.'
            });
        }

        // 1. Fetch Goal Details from Database
        const goal = await Goal.findById(goalId);

        if (!goal) {
            return res.status(404).json({
                status: 'fail',
                message: 'Goal not found with that ID.'
            });
        }

        // Calculate investment horizon (in years) - **UPDATED ROBUST CALCULATION**
        const startDate = new Date(goal.startDate);
        const targetDate = new Date(goal.targetDate);

        let investmentHorizonYears;

        // Ensure target date is not before start date for calculation purposes
        if (targetDate < startDate) {
            console.warn(`Target Date (${targetDate.toISOString()}) is before Start Date (${startDate.toISOString()}) for Goal ID: ${goalId}. Setting investment horizon to 0.1 years.`);
            investmentHorizonYears = 0.1; // Set a small positive default to avoid division by zero or negative horizon
        } else {
            const diffTime = Math.abs(targetDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            investmentHorizonYears = diffDays / 365.25; // Use 365.25 for leap years average

            // Ensure a minimum horizon, avoid 0 or very tiny numbers close to zero
            if (investmentHorizonYears < 0.1) {
                investmentHorizonYears = 0.1;
            }
        }
        // Round to 1 decimal place for clarity in the prompt
        investmentHorizonYears = parseFloat(investmentHorizonYears.toFixed(1));


        // 2. Prepare Prompt for Grok (or your chosen AI model)
        const remainingAmount = goal.goalAmount - goal.currentAmount;
        // The .toLocaleString() is fine for the prompt string as it's sent to Grok as text.
        const prompt = `Generate a diversified investment strategy for a user in the Malaysian market with the following details:
        - Goal: ${goal.goalName}
        - Target Amount: RM${goal.goalAmount.toLocaleString()}
        - Current Savings: RM${goal.currentAmount.toLocaleString()}
        - Remaining Amount to Save: RM${remainingAmount.toLocaleString()}
        - Investment Horizon: ${investmentHorizonYears} years
        - Risk Appetite: ${riskAppetite} (from a scale of Conservative, Moderate, Aggressive)

        Provide the output as a JSON object with the following structure:
        {
          "assetAllocation": [
            { "assetClass": "Equity Funds", "percentage": 0 },
            { "assetClass": "Bonds", "percentage": 0 },
            { "assetClass": "REITs", "percentage": 0 },
            { "assetClass": "Fixed Deposits", "percentage": 0 }
            // Add other asset classes as needed
          ],
          "recommendedFunds": [
            { "fundName": "Fund Name 1", "description": "Short description of Fund 1" },
            { "fundName": "Fund Name 2", "description": "Short description of Fund 2" }
            // ... more funds
          ],
          "suggestedMonthlyInvestment": 0, // In RM
          "expectedAnnualReturn": 0, // As a decimal, e.g., 0.08 for 8%
          "strategyExplanation": {
            "whyThisStrategy": "Explain why this strategy is suitable.",
            "riskReturnAnalysis": "Analyze the risk vs. return.",
            "investmentHorizonImpact": "Explain the impact of the investment horizon."
          }
        }
        Ensure the asset allocation percentages sum up to 100%. Adjust the percentage for each asset class and provide suitable fund names based on the risk appetite and investment horizon.`;

        console.log('Sending prompt to AI model:', prompt);

        // 3. Integrate with Grok (Placeholder - Replace with actual Grok API call)
        // This is where you would make the actual API call to Grok or your chosen AI model.
        // For now, let's return a dummy response to test the flow.
        let aiRawResponse;
        if (process.env.NODE_ENV === 'development') {
            // Simulate AI response for development
            // Ensure suggestedMonthlyInvestment calculation results in a finite number
            const calculatedMonthlyInvestment = Math.round(remainingAmount / (investmentHorizonYears * 12) * (1 + (riskAppetite === 'Aggressive' ? 0.02 : riskAppetite === 'Moderate' ? 0.01 : 0)));
            
            aiRawResponse = `{
                "assetAllocation": [
                    { "assetClass": "Equity Funds", "percentage": ${riskAppetite === 'Aggressive' ? 60 : riskAppetite === 'Moderate' ? 40 : 20} },
                    { "assetClass": "Bonds", "percentage": ${riskAppetite === 'Aggressive' ? 20 : riskAppetite === 'Moderate' ? 30 : 50} },
                    { "assetClass": "REITs", "percentage": ${riskAppetite === 'Aggressive' ? 10 : riskAppetite === 'Moderate' ? 15 : 10} },
                    { "assetClass": "Fixed Deposits", "percentage": ${riskAppetite === 'Aggressive' ? 10 : riskAppetite === 'Moderate' ? 15 : 20} }
                ],
                "recommendedFunds": [
                    { "fundName": "CIMB-Principal KLCI-Linked Fund", "description": "High-growth potential in Malaysian equities." },
                    { "fundName": "Maybank Malaysian Government Bond Fund", "description": "Stable returns with low volatility." }
                ],
                "suggestedMonthlyInvestment": ${calculatedMonthlyInvestment},
                "expectedAnnualReturn": ${riskAppetite === 'Aggressive' ? 0.08 : riskAppetite === 'Moderate' ? 0.06 : 0.04},
                "investmentHorizon": "${investmentHorizonYears} years", 
                "riskLevel": "${riskAppetite}", 
                "strategyExplanation": {
                    "whyThisStrategy": "This strategy balances your goal with your ${riskAppetite} risk appetite, aiming for optimal growth while managing potential volatility.",
                    "riskReturnAnalysis": "A ${riskAppetite} allocation typically offers higher potential returns in exchange for higher volatility. Bonds provide stability, while equities drive growth.",
                    "investmentHorizonImpact": "With a ${investmentHorizonYears}-year horizon, there's sufficient time for market fluctuations to smooth out, making growth-oriented assets more viable even for moderate risk."
                }
            }`;
        } else {
            // **Actual Grok API Call (Example using a hypothetical Grok SDK)**
            // const grokResponse = await grokClient.chat.completions.create({
            //     messages: [{ role: 'user', content: prompt }],
            //     model: 'grok-1' // Or the specific model you intend to use
            // });
            // aiRawResponse = grokResponse.choices[0].message.content; // Adjust based on actual Grok response structure
        }


        let generatedStrategy;
        try {
            // Attempt to parse the AI's response as JSON
            generatedStrategy = JSON.parse(aiRawResponse);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to parse AI model response. It might not be valid JSON.'
            });
        }

        // 4. Send Strategy to Frontend
        res.status(200).json({
            status: 'success',
            data: {
                strategy: generatedStrategy
            }
        });

    } catch (err) {
        console.error('Error in generateInvestmentStrategy:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate investment strategy.',
            error: err.message
        });
    }
};
