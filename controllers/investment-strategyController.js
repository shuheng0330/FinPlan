const Goal = require('../models/goal-planningModel');
const Strategy = require('../models/StrategyModel');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // Load environment variables from .env file
const puppeteer = require('puppeteer'); // Import puppeteer
const ejs = require('ejs');
const path = require('path');


const { OpenAI } = require('openai');
const { strategies } = require('passport');

// Initialize the OpenAI client to use OpenRouter's API
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter API base URL
  apiKey: process.env.OPENROUTER_API_KEY, // Use the new environment variable
});


exports.renderStrategypage = async(req,res)=>{
    try{
        const goals = await Goal.find({user: req.user._id});

        res.render("investment-strategy",{
            title:"FinPlan - Investment Strategy",
            username: req.user.username,
            userEmail: req.user.email,
            pageTitle: "Investment Strategy",
            goals: goals, 
            strategy: null,
        });
    } catch (err) {
        console.error("Error fetching goals:", err);
        res.render("investment-strategy", {
            title: "FinPlan - Investment Strategy",
            username: "Thong Shu Heng",
            userEmail: "thongshuheng030@gmail.com",
            pageTitle: "Investment Strategy",
            goals: [], 
            strategy: [],
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

        const remainingAmount = goal.goalAmount - goal.currentAmount;
        const prompt = `Generate a diversified investment strategy for a user in the Malaysian market with the following details:
        The response must be purely JSON, with no markdown or extra text.

        Goal Details:
        - Goal: ${goal.goalName}
        - Target Amount: RM${goal.goalAmount.toLocaleString()}
        - Current Savings: RM${goal.currentAmount.toLocaleString()}
        - Remaining Amount to Save: RM${remainingAmount.toLocaleString()}
        - Start Date: ${goal.startDate ? goal.startDate.toISOString().split('T')[0] : 'N/A'}
        - Target Date: ${goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : 'N/A'}
        - Investment Horizon: ${investmentHorizonYears} years
        - Priority: ${goal.goalPriority}


        User's Risk Appetite: ${riskAppetite} (from a scale of Conservative, Moderate, Aggressive)

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
            { "fundName": "Fund Name 1", "description": "Short description of Fund 1", "RiskLevel" : "Medium-Low" , "MinimumInvestment" : "RM1000" (please always mention RM) , "Liquidity" : "High" , "Fees" : "1.3%" (Don't include p.a) },
            { "fundName": "Fund Name 2", "description": "Short description of Fund 2", "RiskLevel" : "Medium-Low" , "MinimumInvestment" : "RM1000" (please always mention RM), "Liquidity" : "High" , "Fees" : "1.3%" }
            // ... more funds
          ],
          "suggestedMonthlyInvestment": 0, // In RM (float, 2 decimal places)
          "expectedAnnualReturn": 0, // As a decimal, e.g., 0.08 for 8%
          "investmentHorizon": "${investmentHorizonYears} years", 
          "riskLevel": "${riskAppetite}", 
          "strategyExplanation": {
            "whyThisStrategy": "Explain why this strategy is suitable.",
            "riskReturnAnalysis": "Analyze the risk vs. return.",
            "investmentHorizonImpact": "Explain the impact of the investment horizon."

          "Recommendation" : "Give and explain the recommendation based on goal and risk appetite. e.g. Based on your 2-year time horizon for the vacation goal in the Malaysian market, we recommend a mix of Malaysian government securities and fixed deposits for stability, with allocations to KLCI ETFs and ASEAN equity funds for growth potential. This balanced approach aligns with your moderate risk profile while providing reasonable returns in the Malaysian investment landscape."

          For the strategy comparison, could u show me the percentage of assest for different risk appetide in json format
          The total percentage of stocks, bonds, cash and others must be sum up to 100%
           "strategyComparison": {
            "Conservative": [
                { "Stocks": 0 },
                { "Bonds": 0 },
                { "Cash": 0 },
                { "Other": 0 },
                { "Expectedreturns": 0 // As a decimal, e.g., 0.08 for 8% },
                { "Volatility" : "level like high,medium or low" },
                { "BestFor" : "Example like Short-term goals (1-2 years)" }
            ],
            "Moderate": [
                { "Stocks": 0 },
                { "Bonds": 0 },
                { "Cash": 0 },
                { "Other": 0 },
                { "Expectedreturns": 0 // As a decimal, e.g., 0.08 for 8% },
                { "Volatility" : level like high,medium or low},
                { "BestFor" : "Example like Short-term goals (1-2 years)" }
            ],
            "Aggressive": [
                { "Stocks": 0 },
                { "Bonds": 0 },
                { "Cash": 0 },
                { "Other": 0 },
                { "Expectedreturns": 0 // As a decimal, e.g., 0.08 for 8% },
                { "Volatility" : level like high,medium or low},
                { "BestFor" : "Example like Short-term goals (1-2 years)" }
            ]
          }
        }
        Ensure the asset allocation percentages sum up to 100%. Adjust the percentage for each asset class and provide suitable fund names based on the risk appetite and investment horizon.
        Ensure numerical values are correctly formatted and strings are descriptive. If possible, please explain the strategy generated with more detail and suit to the goal selected and risk appetite level
        Focus on Malaysian context for funds and financial advice.`;

        console.log('Sending prompt to AI model:', prompt);

        let aiRawResponse;
        let generatedStrategy;

        try {
            if (process.env.NODE_ENV === 'development') {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'mistralai/mistral-small-3.2-24b-instruct:free',
                    response_format: { type: "json_object" },
                });
                aiRawResponse = completion.choices[0]?.message?.content; // Use optional chaining
                console.log('AI Raw Response:', aiRawResponse);
            } else {
                // This block is for production or when not in development,
                // and acts as a primary fallback if no AI integration is active.
                const calculatedMonthlyInvestment = Math.round(remainingAmount / (investmentHorizonYears * 12) * (1 + (riskAppetite === 'Aggressive' ? 0.02 : riskAppetite === 'Moderate' ? 0.01 : 0)));
                aiRawResponse = generateFallbackStrategy(goal, riskAppetite, investmentHorizonYears, remainingAmount, calculatedMonthlyInvestment);
            }

            // Attempt to parse the AI's response as JSON
            generatedStrategy = JSON.parse(aiRawResponse);
            console.log('Parsed AI Response:', generatedStrategy);

        } catch (error) {
            console.error('Error with AI model response or parsing, falling back to static strategy:', error);

            // Fallback JSON approach if AI call fails or parsing fails
            const calculatedMonthlyInvestment = Math.round(remainingAmount / (investmentHorizonYears * 12) * (1 + (riskAppetite === 'Aggressive' ? 0.02 : riskAppetite === 'Moderate' ? 0.01 : 0)));
            generatedStrategy = JSON.parse(generateFallbackStrategy(goal, riskAppetite, investmentHorizonYears, remainingAmount, calculatedMonthlyInvestment));
            console.log('Using Fallback Strategy:', generatedStrategy);
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

// Helper function to generate the fallback strategy JSON string
function generateFallbackStrategy(goal, riskAppetite, investmentHorizonYears, remainingAmount, calculatedMonthlyInvestment) {
    let assetAllocationPercentages;
    let expectedAnnualReturn;
    let strategyExplanationWhy;
    let riskReturnAnalysis;
    let recommendation;
    let recommendedFunds;

    switch (riskAppetite) {
        case 'Conservative':
            assetAllocationPercentages = { 'Equity Funds': 15, 'Bonds': 55, 'REITs': 10, 'Fixed Deposits': 20 };
            expectedAnnualReturn = 0.04;
            strategyExplanationWhy = `This strategy prioritizes capital preservation and stable income, suitable for your conservative risk appetite and aiming to meet your ${goal.goalName} goal.`;
            riskReturnAnalysis = "A conservative allocation focuses on lower volatility assets like bonds and fixed deposits, providing steady but modest returns. Equity exposure is minimal to reduce risk.";
            recommendation = `Based on your ${investmentHorizonYears}-year time horizon for the ${goal.goalName} goal in the Malaysian market and a conservative risk profile, we recommend a portfolio heavily weighted towards **Malaysian Government Securities** and **Fixed Deposits** for stability and predictable income. A small allocation to **Malaysian Islamic REITs** could provide some growth and inflation hedge, while minimizing exposure to volatile equities.`;
            recommendedFunds = [
                { "fundName": "Amanah Saham Malaysia (ASM)", "description": "A popular unit trust in Malaysia offering stable returns with low risk, managed by PNB.", "RiskLevel": "Low", "MinimumInvestment": "RM10", "Liquidity": "High", "Fees": "No upfront fees, management fee embedded." },
                { "fundName": "Public Far-East Property & Resorts Fund", "description": "Invests in REITs and property-related assets in the Asia Pacific region, including Malaysia, for income and potential growth.", "RiskLevel": "Medium-Low", "MinimumInvestment": "RM1000", "Liquidity": "Medium", "Fees": "Up to 5.25% sales charge, 1.5% management fee." },
                { "fundName": "Malaysian Government Securities (MGS) via Direct Purchase", "description": "Investing directly in MGS offers competitive, fixed returns backed by the Malaysian government.", "RiskLevel": "Very Low", "MinimumInvestment": "RM1000", "Liquidity": "Medium", "Fees": "Minimal transaction costs." }
            ];
            break;
        case 'Moderate':
            assetAllocationPercentages = { 'Equity Funds': 40, 'Bonds': 30, 'REITs': 15, 'Fixed Deposits': 15 };
            expectedAnnualReturn = 0.06;
            strategyExplanationWhy = `This balanced strategy seeks to achieve growth for your ${goal.goalName} goal while maintaining a moderate level of risk, aligning with your risk appetite.`;
            riskReturnAnalysis = "A moderate allocation balances growth potential from equities with stability from bonds. This offers a reasonable return outlook with manageable volatility, suitable for medium-term goals.";
            recommendation = `Given your ${investmentHorizonYears}-year time horizon for the ${goal.goalName} goal in the Malaysian market and a moderate risk profile, we suggest a balanced mix. This includes allocations to **KLCI ETFs** and **Malaysian equity funds** for growth potential, supplemented by **Malaysian corporate bonds** and **Islamic REITs** for income and diversification. This approach aims for steady appreciation while cushioning against significant market downturns.`;
            recommendedFunds = [
                { "fundName": "FSMOne - Kenanga Growth Fund", "description": "Invests primarily in Malaysian equities with growth potential.", "RiskLevel": "Medium", "MinimumInvestment": "RM100", "Liquidity": "High", "Fees": "Up to 5% sales charge, 1.5% management fee." },
                { "fundName": "Principal Bond Fund", "description": "Invests in a diversified portfolio of Malaysian fixed income securities.", "RiskLevel": "Low-Medium", "MinimumInvestment": "RM1000", "Liquidity": "High", "Fees": "Up to 3% sales charge, 0.8% management fee." },
                { "fundName": "Maybank Global Property Securities Fund", "description": "Provides exposure to global REITs, offering diversification beyond Malaysia while maintaining an income focus.", "RiskLevel": "Medium", "MinimumInvestment": "RM1000", "Liquidity": "Medium", "Fees": "Up to 5.5% sales charge, 1.8% management fee." }
            ];
            break;
        case 'Aggressive':
            assetAllocationPercentages = { 'Equity Funds': 65, 'Bonds': 15, 'REITs': 10, 'Fixed Deposits': 10 };
            expectedAnnualReturn = 0.08;
            strategyExplanationWhy = `This aggressive strategy is designed to maximize potential returns for your ${goal.goalName} goal, suitable for your high-risk appetite and longer investment horizon.`;
            riskReturnAnalysis = "An aggressive allocation emphasizes equities for higher growth potential, accepting higher volatility. This approach is best for investors with a long-term horizon who can withstand significant market fluctuations.";
            recommendation = `With your ${investmentHorizonYears}-year time horizon for the ${goal.goalName} goal in the Malaysian market and an aggressive risk appetite, we advise a growth-oriented portfolio. This involves a significant allocation to **Malaysian and ASEAN equity funds**, including small-cap and technology-focused funds for higher returns. A smaller portion can be allocated to **high-yield corporate bonds** for some income, with minimal cash holdings to ensure maximum capital deployment.`;
            recommendedFunds = [
                { "fundName": "RHB Emerging ASEAN Growth Fund", "description": "Focuses on high-growth companies in emerging ASEAN markets, including Malaysia.", "RiskLevel": "High", "MinimumInvestment": "RM1000", "Liquidity": "Medium", "Fees": "Up to 5.5% sales charge, 1.8% management fee." },
                { "fundName": "Kenanga Syariah Growth Fund", "description": "Invests in Shariah-compliant equities with strong growth prospects in Malaysia.", "RiskLevel": "Medium-High", "MinimumInvestment": "RM100", "Liquidity": "High", "Fees": "Up to 5.25% sales charge, 1.5% management fee." },
                { "fundName": "AmIncome Bond Fund", "description": "A bond fund that seeks to generate income and capital appreciation by investing in a diversified portfolio of fixed income instruments, including higher-yield corporate bonds.", "RiskLevel": "Medium", "MinimumInvestment": "RM1000", "Liquidity": "High", "Fees": "Up to 3.0% sales charge, 0.5% management fee." }
            ];
            break;
        default:
            // Default to Moderate if riskAppetite is unknown
            assetAllocationPercentages = { 'Equity Funds': 40, 'Bonds': 30, 'REITs': 15, 'Fixed Deposits': 15 };
            expectedAnnualReturn = 0.06;
            strategyExplanationWhy = `This balanced strategy seeks to achieve growth for your ${goal.goalName} goal while maintaining a moderate level of risk, as your risk appetite was not specified or recognized.`;
            riskReturnAnalysis = "A moderate allocation balances growth potential from equities with stability from bonds. This offers a reasonable return outlook with manageable volatility, suitable for medium-term goals.";
            recommendation = `Based on your ${investmentHorizonYears}-year time horizon for the ${goal.goalName} goal in the Malaysian market, and without a specified risk appetite, a moderate approach is recommended. This includes allocations to **KLCI ETFs** and **Malaysian equity funds** for growth potential, supplemented by **Malaysian corporate bonds** and **Islamic REITs** for income and diversification. This approach aims for steady appreciation while cushioning against significant market downturns.`;
            recommendedFunds = [
                { "fundName": "FSMOne - Kenanga Growth Fund", "description": "Invests primarily in Malaysian equities with growth potential.", "RiskLevel": "Medium", "MinimumInvestment": "RM100", "Liquidity": "High", "Fees": "Up to 5% sales charge, 1.5% management fee." },
                { "fundName": "Principal Bond Fund", "description": "Invests in a diversified portfolio of Malaysian fixed income securities.", "RiskLevel": "Low-Medium", "MinimumInvestment": "RM1000", "Liquidity": "High", "Fees": "Up to 3% sales charge, 0.8% management fee." },
                { "fundName": "Maybank Global Property Securities Fund", "description": "Provides exposure to global REITs, offering diversification beyond Malaysia while maintaining an income focus.", "RiskLevel": "Medium", "MinimumInvestment": "RM1000", "Liquidity": "Medium", "Fees": "Up to 5.5% sales charge, 1.8% management fee." }
            ];
            break;
    }

    const strategyComparisonData = {
        "Conservative": {
            "Stocks": 25,
            "Bonds": 45,
            "Cash": 30,
            "Other": 0,
            "Expectedreturns": 0.04,
            "Volatility": "Low",
            "BestFor": "Short-term goals (1-3 years), capital preservation"
        },
        "Moderate": {
            "Stocks": 50,
            "Bonds": 35,
            "Cash": 15,
            "Other": 0,
            "Expectedreturns": 0.06,
            "Volatility": "Medium",
            "BestFor": "Medium-term goals (3-7 years), balanced growth and risk"
        },
        "Aggressive": {
            "Stocks": 70,
            "Bonds": 20,
            "Cash": 10,
            "Other": 0,
            "Expectedreturns": 0.08,
            "Volatility": "High",
            "BestFor": "Long-term goals (7+ years), maximizing growth"
        }
    };


    return JSON.stringify({
        "assetAllocation": [
            { "assetClass": "Equity Funds", "percentage": assetAllocationPercentages['Equity Funds'] },
            { "assetClass": "Bonds", "percentage": assetAllocationPercentages['Bonds'] },
            { "assetClass": "REITs", "percentage": assetAllocationPercentages['REITs'] },
            { "assetClass": "Fixed Deposits", "percentage": assetAllocationPercentages['Fixed Deposits'] }
        ],
        "recommendedFunds": recommendedFunds,
        "suggestedMonthlyInvestment": parseFloat(calculatedMonthlyInvestment.toFixed(2)),
        "expectedAnnualReturn": expectedAnnualReturn,
        "investmentHorizon": `${investmentHorizonYears} years`,
        "riskLevel": riskAppetite,
        "strategyExplanation": {
            "whyThisStrategy": strategyExplanationWhy,
            "riskReturnAnalysis": riskReturnAnalysis,
            "investmentHorizonImpact": `With a ${investmentHorizonYears}-year horizon, there's sufficient time for market fluctuations to smooth out, making growth-oriented assets more viable even for moderate risk.`
        },
        "Recommendation": recommendation,
        "strategyComparison": strategyComparisonData
    });
}


exports.downloadStrategyPdf = async (req, res) => {
    try {
        // Expect goalId, riskAppetite, AND the generated strategy object
        const { goalId, riskAppetite, strategy: generatedStrategy } = req.body;

        if (!goalId || !riskAppetite || !generatedStrategy) {
            return res.status(400).json({
                status: 'fail',
                message: 'Goal ID, Risk Appetite, and Strategy data are required to generate the PDF.'
            });
        }

        const goal = await Goal.findById(goalId);

        if (!goal) {
            return res.status(404).json({
                status: 'fail',
                message: 'Goal not found.'
            });
        }

        // Generate chart colors for consistency
        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#607D8B', '#FFC107', '#795548', '#00BCD4'];
        const chartLabels = [];
        const chartData = [];
        const chartColors = [];

        generatedStrategy.assetAllocation.forEach((item, index) => {
            const assetColor = colors[index % colors.length];
            chartLabels.push(item.assetClass);
            chartData.push(item.percentage);
            chartColors.push(assetColor);
        });

        // Render EJS template to HTML string with chart data
        const templatePath = path.join(__dirname, '../views/strategy-pdf-template.ejs');
        const htmlContent = await ejs.renderFile(templatePath, {
            username: req.user.username, // Replace with actual user data if available
            userEmail: req.user.email, // Replace with actual user data
            goalName: goal.goalName,
            riskAppetite: riskAppetite,
            strategy: generatedStrategy, // Use the passed strategy data
            chartLabels: JSON.stringify(chartLabels),
            chartData: JSON.stringify(chartData),
            chartColors: JSON.stringify(chartColors)
        });

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();  

        // Set content and wait for network to be idle
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        await browser.close();

        // Send ONLY the PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="investment-strategy.pdf"');
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate PDF for investment strategy.',
            error: err.message
        });
    }
};


exports.saveInvestmentStrategy = async (req, res, next) => {
    try {
        const { goalId, strategy } = req.body;

        if (!req.user._id) {
            return res.status(401).json({
                status: 'fail',
                message: 'User not authenticated.'
            });
        }

        if (!goalId || !strategy) {
            return res.status(400).json({
                status: 'fail',
                message: 'Goal ID and strategy data are required to save.'
            });
        }


        const newSavedStrategy = await Strategy.create({
            user: req.user._id,
            goal: goalId,
            assetAllocation: strategy.assetAllocation,
            recommendedFunds: strategy.recommendedFunds,
            suggestedMonthlyInvestment: strategy.suggestedMonthlyInvestment,
            expectedAnnualReturn: strategy.expectedAnnualReturn,
            riskLevel: strategy.riskLevel,
            investmentHorizon: strategy.investmentHorizon,
            strategyExplanation: strategy.strategyExplanation,
            chartImage: strategy.chartImage
        });

        res.status(201).json({
            status: 'success',
            message: 'Investment strategy saved successfully!',
            data: {
                Strategy: newSavedStrategy
            }
        });

    } catch (err) {
        console.error('Error saving investment strategy:', err);
        // Handle duplicate key errors if you've added a unique index
        // if (err.code === 11000) {
        //     return res.status(409).json({
        //         status: 'fail',
        //         message: 'This strategy for this goal has already been saved.'
        //     });
        // }
        res.status(500).json({
            status: 'error',
            message: 'Failed to save investment strategy.',
            error: err.message
        });
    }
};

exports.getPastStrategies = async(req,res,next)=>{
    try{
        const userId = req.user ? req.user._id : null;

        if(! userId){
            return res.status(401).json({
                status: 'fail',
                message: 'User not authenticated. Please log in to view past strategies'
            });
        }

        let filter = { user: userId };

        // Add goal filter if provided in query parameters and it's not 'all'
        if (req.query.goal && req.query.goal !== 'all') {
            filter.goal = req.query.goal; // This will correctly filter by goal ID
        }

        // Add risk appetite filter if provided in query parameters and it's not 'all'
        if (req.query.risk && req.query.risk !== 'all') {
            filter.riskLevel = req.query.risk; 
        }

        // Get total count of strategies matching the filters (before applying limit)
        const totalStrategies = await Strategy.countDocuments(filter);

        let query = Strategy.find(filter) 
                                         .populate('goal') 
                                         .sort({createdAt: -1}); // Sort by newest first

        const limitParam = req.query.limit;
        if (limitParam && limitParam !== 'all') {
            const limit = parseInt(limitParam, 10);
            if (!isNaN(limit) && limit > 0) {
                query = query.limit(limit);
            }
        }

        const pastStrategies = await query;
        
        res.status(200).json({
            status: 'success',
            results: pastStrategies.length,
            totalCount: totalStrategies, 
            data: {
                strategies: pastStrategies
            }
        });
    }catch(err){
        console.error('Error fetching past strategies:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve past strategies',
            error: err.message // Include error message for debugging
        });
    }
};