import { initializeAddGoalForm } from '/js/common-add-goal-logic.js'; // Adjust path if needed

let selectedGoalId = null; // Variable to store the ID of the selected goal
let riskAppetite = 'Moderate';
let allocationChartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    const goalCards = document.querySelectorAll('.goal-card');
    const riskAppetiteSlider = document.getElementById('riskSlider');
    const generateStrategyBtn = document.getElementById('generateStrategyBtn');
    const strategyDisplaySection = document.getElementById('strategyDisplaySection'); // Main container for strategy

    const riskLevelBadge = document.getElementById('riskLevelBadge');
    const allocationChartCanvas = document.getElementById('allocationChart');
    const dynamicAssetAllocationContainer = document.getElementById('dynamicAssetAllocationContainer');
    const recommendedFundsList = document.getElementById('recommendedFundsList');
    const suggestedMonthlyInvestmentValue = document.getElementById('suggestedMonthlyInvestmentValue');
    const expectedAnnualReturnValue = document.getElementById('expectedAnnualReturnValue');
    const riskLevelValue = document.getElementById('riskLevelValue');
    const investmentHorizonValue = document.getElementById('investmentHorizonValue');
    const whyThisStrategyText = document.getElementById('whyThisStrategyText');
    const riskReturnAnalysisText = document.getElementById('riskReturnAnalysisText');
    const investmentHorizonImpactText = document.getElementById('investmentHorizonImpactText');

    // Action Buttons
    const regenerateBtn = document.getElementById('regenerateBtn');
    const downloadStrategyBtn = document.getElementById('downloadStrategyBtn');
    const implementStrategyBtn = document.getElementById('implementStrategyBtn');

    // --- Goal Selection Logic ---
    goalCards.forEach(card => {
        card.addEventListener('click', function() {
            goalCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedGoalId = this.dataset.goalId;
            console.log('Selected Goal ID:', selectedGoalId);
            updateGenerateButtonState(); // Call to update button state
            hideStrategyDisplay();
        });
    });

    // --- Risk Appetite Slider Logic ---
    if (riskAppetiteSlider) {
        riskAppetiteSlider.addEventListener('input', function() {
            const sliderValue = parseInt(this.value);
            console.log('Risk level',sliderValue);

            if (sliderValue <= 3) { 
                riskAppetite = 'Conservative';
            } else if (sliderValue <= 7) { 
                riskAppetite = 'Moderate';
            } else { 
                riskAppetite = 'Aggressive';
            }
            console.log('Risk Appetite:', riskAppetite);
            updateGenerateButtonState(); // Call to update button state
            hideStrategyDisplay();
        });
    }

    // --- Function to update the Generate Strategy button state ---
    function updateGenerateButtonState() {
        if (generateStrategyBtn) {
            // Enable button only if a goal is selected AND risk appetite is determined
            // (riskAppetite will always have a value due to default or slider change)
            generateStrategyBtn.disabled = !selectedGoalId; // Only needs a selected goal
        }
    }

    // --- Function to hide and clear the strategy display section ---
    function hideStrategyDisplay() {
        if (strategyDisplaySection) {
            strategyDisplaySection.style.display = 'none';
            // Clear previous content
            suggestedMonthlyInvestmentValue.textContent = '';
            expectedAnnualReturnValue.textContent = '';
            riskLevelValue.textContent = '';
            investmentHorizonValue.textContent = '';
            dynamicAssetAllocationContainer.innerHTML = '';
            recommendedFundsList.innerHTML = '';
            whyThisStrategyText.textContent = '';
            riskReturnAnalysisText.textContent = '';
            investmentHorizonImpactText.textContent = '';

            // Destroy existing chart instance if it exists
            if (allocationChartInstance) {
                allocationChartInstance.destroy();
                allocationChartInstance = null;
            }

            // Disable action buttons
            downloadStrategyBtn.disabled = true;
            implementStrategyBtn.disabled = true;
            regenerateBtn.disabled = true; // Regenerate button might be enabled at the end of generation, but initially disable it
        }
    }


    // Initial call to set the button state when the page loads
    updateGenerateButtonState();
    hideStrategyDisplay();

    if (generateStrategyBtn) {
        generateStrategyBtn.addEventListener('click', async function() {
            if (!selectedGoalId) {
                alert('Please select a goal first!');
                return;
            }

            this.disabled = true;
            this.textContent = 'Generating...';
            hideStrategyDisplay(); // Hide any old strategy while generating new one

            console.log('Attempting to generate strategy for Goal ID:', selectedGoalId, 'with Risk Appetite:', riskAppetite);

            try {
                const response = await fetch('/investment-strategy/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        goalId: selectedGoalId,
                        riskAppetite: riskAppetite
                    }),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const strategyData = responseData.data.strategy;
                    console.log('Generated Strategy:', strategyData);

                    // --- Populate Display Section ---
                    if (strategyData) {
                        // General Info
                        suggestedMonthlyInvestmentValue.textContent = `RM${strategyData.suggestedMonthlyInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        expectedAnnualReturnValue.textContent = `${(strategyData.expectedAnnualReturn * 100).toFixed(2)}%`;
                        riskLevelValue.textContent = strategyData.riskLevel;
                        investmentHorizonValue.textContent = strategyData.investmentHorizon; // From updated mock

                        // Risk Level Badge styling
                        riskLevelBadge.textContent = strategyData.riskLevel + ' Risk';
                        riskLevelBadge.classList.remove('risk-low', 'risk-medium', 'risk-high'); // Clear previous classes
                        if (strategyData.riskLevel === 'Conservative') {
                            riskLevelBadge.classList.add('risk-low');
                        } else if (strategyData.riskLevel === 'Moderate') {
                            riskLevelBadge.classList.add('risk-medium');
                        } else if (strategyData.riskLevel === 'Aggressive') {
                            riskLevelBadge.classList.add('risk-high');
                        }

                        // Populate Asset Allocation (Dynamic Generation)
                        dynamicAssetAllocationContainer.innerHTML = ''; // Clear previous content
                        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#607D8B', '#FFC107', '#795548', '#00BCD4']; // Example colors
                        const chartLabels = [];
                        const chartData = [];
                        const chartColors = [];

                        strategyData.assetAllocation.forEach((item, index) => {
                            const assetColor = colors[index % colors.length]; // Cycle through colors
                            chartLabels.push(item.assetClass);
                            chartData.push(item.percentage);
                            chartColors.push(assetColor);

                            const assetItemDiv = document.createElement('div');
                            assetItemDiv.classList.add('asset-item');
                            assetItemDiv.innerHTML = `
                                <div class="asset-color" style="background-color: ${assetColor};"></div>
                                <div class="asset-name">${item.assetClass}</div>
                                <div class="asset-percentage">${item.percentage}%</div>
                            `;
                            dynamicAssetAllocationContainer.appendChild(assetItemDiv);
                        });

                        // Create/Update Chart.js Pie Chart
                        if (allocationChartInstance) {
                            allocationChartInstance.destroy(); // Destroy previous instance if it exists
                        }
                        const ctx = allocationChartCanvas.getContext('2d');
                        allocationChartInstance = new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: chartLabels,
                                datasets: [{
                                    data: chartData,
                                    backgroundColor: chartColors,
                                    hoverOffset: 4
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                let label = context.label || '';
                                                if (label) {
                                                    label += ': ';
                                                }
                                                if (context.parsed !== null) {
                                                    label += context.parsed + '%';
                                                }
                                                return label;
                                            }
                                        }
                                    }
                                }
                            }
                        });


                        // Populate Recommended Funds (Dynamic Generation)
                        recommendedFundsList.innerHTML = ''; // Clear previous content
                        strategyData.recommendedFunds.forEach(fund => {
                            const listItem = document.createElement('li');
                            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                            // Using description as badge text if no specific percentage for fund is given by AI
                            listItem.innerHTML = `
                                ${fund.fundName}
                                <span class="badge bg-primary rounded-pill">${fund.description}</span>
                            `;
                            recommendedFundsList.appendChild(listItem);
                        });

                        // Populate Strategy Explanation
                        whyThisStrategyText.textContent = strategyData.strategyExplanation.whyThisStrategy;
                        riskReturnAnalysisText.textContent = strategyData.strategyExplanation.riskReturnAnalysis;
                        investmentHorizonImpactText.textContent = strategyData.strategyExplanation.investmentHorizonImpact;

                        strategyDisplaySection.style.display = 'block'; // Show the strategy display section
                        alert('Strategy generated successfully!');

                        // Enable action buttons
                        downloadStrategyBtn.disabled = false;
                        implementStrategyBtn.disabled = false;
                        regenerateBtn.disabled = false;

                    } else {
                        alert('Generated strategy data is empty.');
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Error generating strategy:', errorData);
                    alert('Failed to generate strategy: ' + (errorData.message || 'Something went wrong.'));
                }
            } catch (error) {
                console.error('Network error during strategy generation:', error);
                alert('Could not connect to the server to generate strategy. Please check your internet connection.');
            } finally {
                this.disabled = false;
                this.textContent = 'Generate Strategy';
            }
        });
    }

    // --- Action Button Click Handlers (Implement in next steps) ---
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            // Simply trigger the generateStrategyBtn click
            generateStrategyBtn.click();
        });
    }

    // (Add event listeners for downloadStrategyBtn and implementStrategyBtn here later)
    if (downloadStrategyBtn) {
        downloadStrategyBtn.addEventListener('click', function() {
            console.log('Download Strategy clicked');
            // Logic for PDF download
        });
    }

    if (implementStrategyBtn) {
        implementStrategyBtn.addEventListener('click', function() {
            console.log('Implement Strategy clicked');
            // Logic for saving/implementing strategy
        });
    }



// --- MODIFIED Goal Pagination Logic (as provided in previous answer) ---
    const allGoalCols = document.querySelectorAll('.goal-page .col-md-4');
    const goalsPerPage = 3;
    let currentPage = 1;
    const totalGoals = allGoalCols.length;
    const totalPages = Math.ceil(totalGoals / goalsPerPage);

    const prevGoalsBtn = document.getElementById('prevGoalsBtn');
    const nextGoalsBtn = document.getElementById('nextGoalsBtn');

    function updateGoalCardVisibility() {
        allGoalCols.forEach(col => {
            col.style.display = 'none';
        });

        const startIndex = (currentPage - 1) * goalsPerPage;
        const endIndex = Math.min(startIndex + goalsPerPage, totalGoals);

        for (let i = startIndex; i < endIndex; i++) {
            if (allGoalCols[i]) {
                allGoalCols[i].style.display = 'block';
            }
        }

        if (prevGoalsBtn) {
            prevGoalsBtn.disabled = currentPage === 1;
            prevGoalsBtn.style.display = totalGoals <= goalsPerPage ? 'none' : 'inline-flex';
        }
        if (nextGoalsBtn) {
            nextGoalsBtn.disabled = currentPage === totalPages || totalGoals === 0;
            nextGoalsBtn.style.display = totalGoals <= goalsPerPage ? 'none' : 'inline-flex';
        }
    }

    if (prevGoalsBtn) {
        prevGoalsBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateGoalCardVisibility();
            }
        });
    }

    if (nextGoalsBtn) {
        nextGoalsBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                updateGoalCardVisibility();
            }
        });
    }

    if (totalGoals > 0) {
        updateGoalCardVisibility();
        // --- NEW CODE HERE: Select the first goal card after initial display ---
        const firstGoalCard = document.querySelector('.goal-card'); // Select the first goal card
        if (firstGoalCard) {
            // Remove 'selected' from all first, to be safe (though EJS should no longer add it)
            goalCards.forEach(c => c.classList.remove('selected'));
            firstGoalCard.classList.add('selected'); // Add 'selected' to the first one
        }
    } else {
        if (prevGoalsBtn) prevGoalsBtn.style.display = 'none';
        if (nextGoalsBtn) nextGoalsBtn.style.display = 'none';
    }


    // // --- Existing Chart and Calculator Initializations (unchanged) ---
    // const allocationCtx = document.getElementById('allocationChart') ? document.getElementById('allocationChart').getContext('2d') : null;
    // if (allocationCtx) {
    //     const allocationChart = new Chart(allocationCtx, {
    //         type: 'pie',
    //         data: {
    //             labels: [
    //                 'FTSE Bursa Malaysia KLCI ETF',
    //                 'Malaysian Government Securities',
    //                 'Malaysian REITs',
    //                 'ASEAN Equity Funds',
    //                 'Fixed Deposits'
    //             ],
    //             datasets: [{
    //                 data: [25, 20, 15, 25, 15],
    //                 backgroundColor: [
    //                     '#4CAF50',
    //                     '#2196F3',
    //                     '#9C27B0',
    //                     '#FF9800',
    //                     '#607D8B'
    //                 ],
    //                 borderWidth: 0
    //             }]
    //         },
    //         options: {
    //             responsive: true,
    //             maintainAspectRatio: false,
    //             plugins: {
    //                 legend: {
    //                     display: false
    //                 },
    //                 tooltip: {
    //                     callbacks: {
    //                         label: function(context) {
    //                             return context.label + ': ' + context.raw + '%';
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // }

    // const riskReturnCtx = document.getElementById('riskReturnChart') ? document.getElementById('riskReturnChart').getContext('2d') : null;
    // if (riskReturnCtx) {
    //     const riskReturnChart = new Chart(riskReturnCtx, {
    //         type: 'scatter',
    //         data: {
    //             datasets: [
    //                 {
    //                     label: 'Conservative',
    //                     data: [{ x: 5, y: 3.5 }],
    //                     backgroundColor: '#4CAF50',
    //                     pointRadius: 10
    //                 },
    //                 {
    //                     label: 'Moderate',
    //                     data: [{ x: 10, y: 5.8 }],
    //                     backgroundColor: '#FF9800',
    //                     pointRadius: 10
    //                 },
    //                 {
    //                     label: 'Aggressive',
    //                     data: [{ x: 15, y: 7.5 }],
    //                     backgroundColor: '#F44336',
    //                     pointRadius: 10
    //                 },
    //                 {
    //                     label: 'Your Strategy',
    //                     data: [{ x: 10, y: 5.8 }],
    //                     backgroundColor: '#6366f1',
    //                     pointRadius: 12,
    //                     pointStyle: 'star'
    //                 }
    //             ]
    //         },
    //         options: {
    //             responsive: true,
    //             maintainAspectRatio: false,
    //             scales: {
    //                 x: {
    //                     title: {
    //                         display: true,
    //                         text: 'Risk (Volatility)'
    //                     },
    //                     min: 0,
    //                     max: 20
    //                 },
    //                 y: {
    //                     title: {
    //                         display: true,
    //                         text: 'Expected Return (%)'
    //                     },
    //                     min: 0,
    //                     max: 10
    //                 }
    //             },
    //             plugins: {
    //                 tooltip: {
    //                     callbacks: {
    //                         label: function(context) {
    //                             return context.dataset.label + ': ' + context.raw.y + '% return, ' + context.raw.x + ' risk';
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // }

    if (generateStrategyBtn) {
        generateStrategyBtn.addEventListener('click', function() {
            document.querySelector('.strategy-recommendation').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const calculateRoiBtn = document.getElementById('calculateRoiBtn');
    if (calculateRoiBtn) {
        calculateRoiBtn.addEventListener('click', function() {
            const initialInvestmentInput = document.getElementById('initialInvestment');
            const monthlyContributionInput = document.getElementById('monthlyContribution');
            const annualReturnInput = document.getElementById('annualReturn');
            const investmentPeriodInput = document.getElementById('investmentPeriod');

            const initialInvestment = parseFloat(initialInvestmentInput.value);
            const monthlyContribution = parseFloat(monthlyContributionInput.value);
            const annualReturn = parseFloat(annualReturnInput.value) / 100;
            const investmentPeriod = parseInt(investmentPeriodInput.value);

            if (isNaN(initialInvestment) || initialInvestment < 0) {
                alert('Please enter a valid non-negative Initial Investment.');
                initialInvestmentInput.focus();
                return;
            }
            if (isNaN(monthlyContribution) || monthlyContribution < 0) {
                alert('Please enter a valid non-negative Monthly Contribution.');
                monthlyContributionInput.focus();
                return;
            }
            if (isNaN(annualReturn) || annualReturn < 0) {
                alert('Please enter a valid non-negative Annual Return (percentage).');
                annualReturnInput.focus();
                return;
            }
            if (isNaN(investmentPeriod) || investmentPeriod <= 0) {
                alert('Please enter a valid positive Investment Period (in years).');
                investmentPeriodInput.focus();
                return;
            }

            const monthlyRate = annualReturn / 12;
            let balance = initialInvestment;

            for (let i = 0; i < investmentPeriod * 12; i++) {
                balance = balance * (1 + monthlyRate) + monthlyContribution;
            }

            const totalInvestment = initialInvestment + (monthlyContribution * investmentPeriod * 12);
            const totalInterest = balance - totalInvestment;
            const roi = (totalInvestment > 0) ? (totalInterest / totalInvestment) * 100 : 0;

            document.getElementById('totalInvestment').textContent = 'RM' + totalInvestment.toFixed(2);
            document.getElementById('totalInterest').textContent = 'RM' + totalInterest.toFixed(2);
            document.getElementById('finalBalance').textContent = 'RM' + balance.toFixed(2);
            document.getElementById('roiPercentage').textContent = roi.toFixed(2) + '%';
        });
    }

    initializeAddGoalForm();
});

// You might want to export selectedGoalId or a getter function if other modules need it
export { selectedGoalId, riskAppetite };