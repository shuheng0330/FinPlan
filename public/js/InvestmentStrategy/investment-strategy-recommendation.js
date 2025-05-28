
document.addEventListener('DOMContentLoaded', function() {
    // --- Existing Goal Selection Logic ---
    const goalCards = document.querySelectorAll('.goal-card'); // Still selecting all for click handler
    goalCards.forEach(card => {
        card.addEventListener('click', function() {
            goalCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // --- Icon Selection Logic (Modified to store the selected icon) ---
    const iconOptions = document.querySelectorAll(".icon-option");
    let selectedIcon = ''; // Variable to store the selected icon's data-icon value

    iconOptions.forEach(option => {
        option.addEventListener("click", () => {
            iconOptions.forEach(o => o.classList.remove("selected"));
            option.classList.add("selected");
            selectedIcon = option.querySelector('img').dataset.icon;
        });
    });

    const initiallySelectedIconOption = document.querySelector('.icon-option.selected');
    if (initiallySelectedIconOption) {
        selectedIcon = initiallySelectedIconOption.querySelector('img').dataset.icon;
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


    // --- Existing Chart and Calculator Initializations (unchanged) ---
    const allocationCtx = document.getElementById('allocationChart') ? document.getElementById('allocationChart').getContext('2d') : null;
    if (allocationCtx) {
        const allocationChart = new Chart(allocationCtx, {
            type: 'pie',
            data: {
                labels: [
                    'FTSE Bursa Malaysia KLCI ETF',
                    'Malaysian Government Securities',
                    'Malaysian REITs',
                    'ASEAN Equity Funds',
                    'Fixed Deposits'
                ],
                datasets: [{
                    data: [25, 20, 15, 25, 15],
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3',
                        '#9C27B0',
                        '#FF9800',
                        '#607D8B'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    const riskReturnCtx = document.getElementById('riskReturnChart') ? document.getElementById('riskReturnChart').getContext('2d') : null;
    if (riskReturnCtx) {
        const riskReturnChart = new Chart(riskReturnCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Conservative',
                        data: [{ x: 5, y: 3.5 }],
                        backgroundColor: '#4CAF50',
                        pointRadius: 10
                    },
                    {
                        label: 'Moderate',
                        data: [{ x: 10, y: 5.8 }],
                        backgroundColor: '#FF9800',
                        pointRadius: 10
                    },
                    {
                        label: 'Aggressive',
                        data: [{ x: 15, y: 7.5 }],
                        backgroundColor: '#F44336',
                        pointRadius: 10
                    },
                    {
                        label: 'Your Strategy',
                        data: [{ x: 10, y: 5.8 }],
                        backgroundColor: '#6366f1',
                        pointRadius: 12,
                        pointStyle: 'star'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk (Volatility)'
                        },
                        min: 0,
                        max: 20
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Expected Return (%)'
                        },
                        min: 0,
                        max: 10
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.y + '% return, ' + context.raw.x + ' risk';
                            }
                        }
                    }
                }
            }
        });
    }

    const riskSlider = document.getElementById('riskSlider');
    if (riskSlider) {
        riskSlider.addEventListener('input', function() {
            console.log('Risk level:', this.value);
        });
    }

    const generateStrategyBtn = document.getElementById('generateStrategyBtn');
    if (generateStrategyBtn) {
        generateStrategyBtn.addEventListener('click', function() {
            document.querySelector('.strategy-recommendation').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const downloadStrategyBtn = document.getElementById('downloadStrategyBtn');
    if (downloadStrategyBtn) {
        downloadStrategyBtn.addEventListener('click', function() {
            alert('Strategy PDF downloaded successfully!');
        });
    }

    const implementStrategyBtn = document.getElementById('implementStrategyBtn');
    if (implementStrategyBtn) {
        implementStrategyBtn.addEventListener('click', function() {
            alert('Strategy implementation initiated! You will be redirected to the investment platform to complete the process.');
        });
    }

    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            alert('Generating alternative strategy...');
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

    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', async function() {
            const addGoalForm = document.getElementById('addGoalForm');

            if (!addGoalForm.checkValidity()) {
                addGoalForm.reportValidity();
                return;
            }

            const goalName = document.getElementById('goalName').value.trim();
            const goalAmount = parseFloat(document.getElementById('goalAmount').value);
            const currentAmount = parseFloat(document.getElementById('currentAmount').value);
            const targetDate = document.getElementById('targetDate').value;
            const startDate = document.getElementById('startDate').value;
            const goalPriority = document.getElementById('goalPriority').value;

            if (goalName === '') {
                alert('Goal Name cannot be empty.');
                document.getElementById('goalName').focus();
                return;
            }
            if (isNaN(goalAmount) || goalAmount <= 0) {
                alert('Target Amount must be a positive number.');
                document.getElementById('goalAmount').focus();
                return;
            }
            if (isNaN(currentAmount) || currentAmount < 0) {
                alert('Current Savings must be a non-negative number.');
                document.getElementById('currentAmount').focus();
                return;
            }
            if (currentAmount > goalAmount) {
                alert('Current Savings cannot be greater than Target Amount.');
                document.getElementById('currentAmount').focus();
                return;
            }

            const parsedStartDate = new Date(startDate);
            const parsedTargetDate = new Date(targetDate);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedTargetDate.getTime())) {
                alert('Please select valid Start and Target Dates.');
                return;
            }
            if (parsedStartDate > parsedTargetDate) {
                alert('Start Date cannot be after Target Date.');
                document.getElementById('startDate').focus();
                return;
            }
            if (!selectedIcon) {
                alert('Please select an icon for your goal.');
                return;
            }

            const goalData = {
                goalName,
                goalAmount,
                currentAmount,
                targetDate,
                startDate,
                goalPriority,
                icon: selectedIcon
            };

            console.log('Attempting to send goal data:', goalData);

            try {
                const response = await fetch('/investment-strategy', { // Corrected API endpoint for consistency
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(goalData),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Goal saved successfully:', result);

                    const modalElement = document.getElementById('addGoalModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }

                    alert('Goal added successfully!');
                    window.location.reload();

                    addGoalForm.reset();
                    iconOptions.forEach(opt => opt.classList.remove('selected'));
                    if (initiallySelectedIconOption) {
                        initiallySelectedIconOption.classList.add('selected');
                        selectedIcon = initiallySelectedIconOption.querySelector('img').dataset.icon;
                    } else {
                        selectedIcon = '';
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Error saving goal:', errorData);
                    alert('Error saving goal: ' + (errorData.message || 'Something went wrong. Please check your inputs.'));
                }
            } catch (error) {
                console.error('Network error or unexpected issue:', error);
                alert('Failed to connect to the server. Please check your internet connection or try again later.');
            }
        });
    }
});