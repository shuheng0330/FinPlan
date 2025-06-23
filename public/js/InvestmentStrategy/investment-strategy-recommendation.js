import { initializeAddGoalForm } from '/js/common-add-goal-logic.js'; // Adjust path if needed

let selectedGoalId = null; // Variable to store the ID of the selected goal
let riskAppetite = 'Moderate';
let allocationChartInstance = null;
let currentGeneratedStrategy = null;
let riskReturnChartInstance = null; // To store the Chart.js instance

let modealAllocationChartInstance = null;
let strategyDetailModal;

const INITIAL_STRATEGY_LIMIT = 3;
let strategiesCache = [];
let isShowingAllStrategies = false;

let currentGoalFilter = 'all'; // Initialize filter for goals
let currentRiskFilter = 'all'; // Initialize filter for risk appetite

document.addEventListener('DOMContentLoaded', function() {
    const goalCards = document.querySelectorAll('.goal-card');
    const riskAppetiteSlider = document.getElementById('riskSlider');
    const generateStrategyBtn = document.getElementById('generateStrategyBtn');
    const strategyDisplaySection = document.getElementById('strategyDisplaySection'); // Main container for strategy

    // Toast elements
    const successToast = document.getElementById('successToast');
    const successToastBody = document.getElementById('successToastBody');
    const errorToast = document.getElementById('errorToast');
    const errorToastBody = document.getElementById('errorToastBody');

    // Bootstrap Toast instances
    const bsSuccessToast = new bootstrap.Toast(successToast, { autohide: true, delay: 5000 });
    const bsErrorToast = new bootstrap.Toast(errorToast, { autohide: true, delay: 7000 });

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

    const pastStrategiesContainer = document.getElementById('pastStrategiesContainer');
    const seeMoreStrategiesBtn = document.getElementById('seeMoreStrategiesBtn');
    const hideStrategiesBtn = document.getElementById('hideStrategiesBtn');
    const noPastStrategiesMessage = document.getElementById('noPastStrategiesMessage');
    const modalElement = document.getElementById('strategyDetailModal');
    strategyDetailModal = new bootstrap.Modal(modalElement);
    const comparisonToolModalElement = document.getElementById('comparisonToolModal');
    const comparisonModal = new bootstrap.Modal(comparisonToolModalElement);
    const riskAnalyzerModalElement = document.getElementById('riskAnalyzerModal');


    // Action Buttons
    const regenerateBtn = document.getElementById('regenerateBtn');
    const downloadStrategyBtn = document.getElementById('downloadStrategyBtn');
    const implementStrategyBtn = document.getElementById('implementStrategyBtn');
    document.getElementById('dynamicRiskLevel').textContent = 'N/A';
    document.getElementById('riskReturnAnalysistext').textContent = 'No detailed analysis available.';
    document.getElementById('recommendedStrategyText').textContent = 'No specific recommendation available.';

    // --- Helper function to show toast messages ---
    function showToast(message, type = 'success') {
        if (type === 'success') {
            successToastBody.textContent = message;
            bsSuccessToast.show();
        } else {
            errorToastBody.textContent = message;
            bsErrorToast.show();
        }
    }

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
                window.toast.warning('Please select a goal first!');
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
                    currentGeneratedStrategy = strategyData;

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
                                        display: true,
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

                        
                            setTimeout(() => {
                                try {
                                    console.log("Canvas size:", ctx.canvas.width, ctx.canvas.height);
                                    console.log("Chart data:", allocationChartInstance.data);

                                    const chartImageBase64 = allocationChartInstance.toBase64Image();
                                    currentGeneratedStrategy.chartImage = chartImageBase64.startsWith("data:image")? chartImageBase64: "data:image/png;base64," + chartImageBase64.split(',')[1];

                                    window.chartRendered = true;
                                    console.log("Chart rendered and flag set to true.");
                                    console.log("Chart image size (base64):", currentGeneratedStrategy.chartImage?.length);
                                    console.log("chartImage starts with:", currentGeneratedStrategy.chartImage.slice(0, 30));
                                } catch (e) {
                                    console.error("Failed to convert chart to image:", e);
                                    currentGeneratedStrategy.chartImage = null;
                                }
                            }, 1500); // waits 500ms to ensure canvas rendering is complete

                        // Populate Recommended Funds (Dynamic Generation)
                        recommendedFundsList.innerHTML = ''; // Clear previous content
                        strategyData.recommendedFunds.forEach(fund => {
                            const listItem = document.createElement('li');
                            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
                            // Using description as badge text if no specific percentage for fund is given by AI
                            listItem.innerHTML = `
                                <div>
                                   <h6 class="mb-1">${fund.fundName}</h6>
                                   <p class="mb-0 text-muted small">${fund.description}</p>
                                </div>
                            `;
                            recommendedFundsList.appendChild(listItem);
                        });

                        // Populate Strategy Explanation
                        whyThisStrategyText.textContent = strategyData.strategyExplanation.whyThisStrategy;
                        riskReturnAnalysisText.textContent = strategyData.strategyExplanation.riskReturnAnalysis;
                        investmentHorizonImpactText.textContent = strategyData.strategyExplanation.investmentHorizonImpact;

                        displayStrategyComparison(strategyData);
                        updateComparisonTable(strategyData, riskAppetite);
                        comparisonToolModalElement.addEventListener('shown.bs.modal', function () {
                        // Now that the modal is open, call your function to update its content
                            updateComparisonOption(strategyData);
                        }, { once: true }); // The { once: true } option ensures the listener runs only once

                        riskAnalyzerModalElement.addEventListener('shown.bs.modal', function () {
                            updateRiskAnalyzerModal(strategyData);
                        },{ once: true});


                        strategyDisplaySection.style.display = 'block'; // Show the strategy display section
                         window.toast.success('Strategy generated successfully!');

                        // Enable action buttons
                        downloadStrategyBtn.disabled = false;
                        implementStrategyBtn.disabled = false;
                        regenerateBtn.disabled = false;

                    } else {
                        window.toast.error('Generated strategy data is empty.', 'error');
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Error generating strategy:', errorData);
                    showindow.toast.error('Failed to generate strategy: ' + (errorData.message || 'Something went wrong.'), 'error'); 
                }
            } catch (error) {
                console.error('Network error during strategy generation:', error);
                window.toast.error('Could not connect to the server to generate strategy. Please check your internet connection.', 'error'); 
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
        downloadStrategyBtn.addEventListener('click', async function() {

            console.log('Attempting PDF download...');
            console.log('selectedGoalId:', selectedGoalId);
            console.log('riskAppetite:', riskAppetite);
            console.log('currentGeneratedStrategy:', currentGeneratedStrategy);

            if (!selectedGoalId) {
                window.toast.error('Please select a goal first to generate a PDF.', 'error');
                return;
            }
            if (!riskAppetite) {
                window.toast.error('Risk appetite is not set. Please generate a strategy first.', 'error');
                return;
            }

            try {
                // Send selectedGoalId and riskAppetite to the backend
                const response = await fetch('/investment-strategy/download-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        goalId: selectedGoalId,
                        riskAppetite: riskAppetite,
                        strategy: currentGeneratedStrategy
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'FinPlan_Investment_Strategy.pdf';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    window.toast.success('Download successfully');
                } else {
                    const errorData = await response.json();
                    console.error('Error downloading PDF:', errorData);
                    window.toast.error(`Failed to download PDF: ${errorData.message || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Network error during PDF download:', error);
                window.toast.error('Network error or unexpected issue during PDF download.', 'error');
            }
        });
    }

    if (implementStrategyBtn) {
        implementStrategyBtn.addEventListener('click', async function() {
            console.log('Implement Strategy clicked');
            console.log('selectedGoalId:', selectedGoalId);
            console.log('currentGeneratedStrategy:', currentGeneratedStrategy);

            if(!selectedGoalId || !currentGeneratedStrategy){
                window.toast.warning('Please generate an investment strategy first.','error');
                return;
            }

            try{
                implementStrategyBtn.disabled = true;
                implementStrategyBtn.textContent = 'Saving...';

                const response = await fetch('/investment-strategy/save',{
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        goalId: selectedGoalId,
                        strategy: currentGeneratedStrategy
                    })
                });

                const data = await response.json();

                if(data.status === 'success'){
                    await fetchAndDisplayPastStrategies(false);
                    window.toast.success('Investment strategy saved successfully!');
                }else{
                    window.toast.error('Failed to save investment strategy. Unknown error.', 'error');
                }
            }catch (error){
                console.error('Error saving strategy:',error);
                window.toast.error('An unexpected error occurred while saving the strategy.','error');
            }finally{
                implementStrategyBtn.disabled = false;
                implementStrategyBtn.textContent = 'Implement Strategy';
            }
        });
    }
    function drawChart(assetAllocation, canvasElement) {
        if (!canvasElement) {
            console.warn('Canvas element not found for chart drawing.');
            return;
        }

        // Destroy existing chart instance if it exists on this canvas
        let existingChartInstance = Chart.getChart(canvasElement);
        if (existingChartInstance) {
            existingChartInstance.destroy();
        }

        if (!assetAllocation || assetAllocation.length === 0) {
            const ctx = canvasElement.getContext('2d');
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear canvas
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No asset allocation data available.', canvasElement.width / 2, canvasElement.height / 2);
            return;
        }

        const labels = assetAllocation.map(a => a.assetClass);
        const percentages = assetAllocation.map(a => a.percentage);

        const ctx = canvasElement.getContext('2d');
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: percentages,
                    backgroundColor: [
                        '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF9800'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.toFixed !== undefined) {
                                    label += context.parsed.toFixed(2) + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }


        // Function to create a past strategy card
    // This creates the small card with Goal Name, Risk Level, Expected Return, and Investment Horizon
    function createStrategyCard(strategy) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm past-strategy-card cursor-pointer bg-white'; // Add cursor-pointer for visual cue
        card.dataset.strategy = JSON.stringify(strategy); // Store full strategy data in dataset

        let goalName = strategy.goal && strategy.goal.goalName ? strategy.goal.goalName : 'N/A';
        let formattedDate = new Date(strategy.createdAt).toLocaleDateString();

        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${goalName}</h5>
                <h6 class="card-subtitle mb-2 text-muted">Risk Level: <span class="badge bg-${getRiskBadgeClass(strategy.riskLevel)}">${strategy.riskLevel}</span></h6>
                <p class="card-text">
                    <strong>Expected Return:</strong> ${strategy.expectedAnnualReturn ? (strategy.expectedAnnualReturn *100).toFixed(2) : 'N/A'}%<br>
                    <strong>Investment Horizon:</strong> ${strategy.investmentHorizon || 'N/A'}<br>
                    <small class="text-muted">Saved on: ${formattedDate}</small>
                </p>
            </div>
        `;

        card.addEventListener('click', function() {
            const clickedStrategy = JSON.parse(this.dataset.strategy);
            showStrategyDetailsModal(clickedStrategy);
        });

        colDiv.appendChild(card);
        return colDiv;
    }

    // Helper to get Bootstrap badge class based on risk level
    function getRiskBadgeClass(riskLevel) {
        switch (riskLevel) {
            case 'Conservative': return 'success';
            case 'Moderate': return 'warning text-dark';
            case 'Aggressive': return 'danger';
            default: return 'secondary';
        }
    }

    const riskReturnCtx = document.getElementById('riskReturnChart').getContext('2d');
    riskReturnChartInstance = new Chart(riskReturnCtx, { // Assign to the global instance
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
                    data: [{ x: 0, y: 0 }], // Initial placeholder data, will be updated
                    backgroundColor: '#6366f1',
                    pointRadius: 12,
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
                    max: 20
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

    // Function to display strategy details in the modal (the "enlarged" view)
    function showStrategyDetailsModal(strategy) {
        document.getElementById('modalGoalName').textContent = strategy.goal && strategy.goal.goalName ? strategy.goal.goalName : 'N/A';
        document.getElementById('modalRiskLevel').textContent = strategy.riskLevel || 'N/A';
        document.getElementById('modalInvestmentHorizon').textContent = strategy.investmentHorizon || 'N/A';
        document.getElementById('modalExpectedAnnualReturn').textContent = strategy.expectedAnnualReturn ? (strategy.expectedAnnualReturn *100).toFixed(2) : 'N/A';
        document.getElementById('modalSuggestedMonthlyInvestment').textContent = strategy.suggestedMonthlyInvestment ? strategy.suggestedMonthlyInvestment.toFixed(2) : 'N/A';

        // Asset Allocation details and chart
        const modalAssetAllocationContainer = document.getElementById('modalAssetAllocationContainer');
        modalAssetAllocationContainer.innerHTML = ''; // Clear previous content
        if (strategy.assetAllocation && strategy.assetAllocation.length > 0) {
            strategy.assetAllocation.forEach(item => {
                const p = document.createElement('p');
                p.textContent = `${item.assetClass}: ${item.percentage}%`;
                modalAssetAllocationContainer.appendChild(p);
            });
            // Draw chart for modal
            const modalAllocationChartCanvas = document.getElementById('modalAllocationChart');
            modealAllocationChartInstance = drawChart(strategy.assetAllocation, modalAllocationChartCanvas);
            modalAllocationChartCanvas.style.display = 'block'; // Ensure canvas is visible
        } else {
            modalAssetAllocationContainer.textContent = 'No detailed asset allocation available.';
            document.getElementById('modalAllocationChart').style.display = 'none'; // Hide canvas if no data
        }

        // Recommended Funds
        const modalRecommendedFundsList = document.getElementById('modalRecommendedFundsList');
        modalRecommendedFundsList.innerHTML = ''; // Clear previous content
        if (strategy.recommendedFunds && strategy.recommendedFunds.length > 0) {
            strategy.recommendedFunds.forEach(fund => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <div>
                    <strong>${fund.fundName}</strong>
                    <p class="text-muted mb-0">${fund.description || 'No description'}</p>
                </div>
            `;
            modalRecommendedFundsList.appendChild(li);
        });
        } else {
            modalRecommendedFundsList.innerHTML = '<li class="list-group-item text-muted">No recommended funds available.</li>';
        }

    // Strategy Explanation
    const modalStrategyExplanationContainer = document.getElementById('modalStrategyExplanationContainer');
    modalStrategyExplanationContainer.innerHTML = ''; // Clear previous content

    // Helper function to add each explanation point
    function addExplanationPoint(title, content) {
        const li = document.createElement('li');
        li.className = 'list-group-item'; // Add margin for spacing between explanation points
        li.innerHTML = `
        <div>
            <strong>${title}</strong>
            <p class="text-muted mb-0">${content || 'No explanation provided.'}</p>
        </div>
        `;
        modalStrategyExplanationContainer.appendChild(li);
    }

    // Call the helper function for each explanation part
    addExplanationPoint('Why This Strategy', strategy.strategyExplanation && strategy.strategyExplanation.whyThisStrategy);
    addExplanationPoint('Risk vs. Return Analysis', strategy.strategyExplanation && strategy.strategyExplanation.riskReturnAnalysis);
    addExplanationPoint('Investment Horizon Impact', strategy.strategyExplanation && strategy.strategyExplanation.investmentHorizonImpact);

        strategyDetailModal.show(); // Show the Bootstrap modal
    }


async function fetchAndDisplayPastStrategies(fetchAll = true) {
    console.log("Fetching strategies, fetchAll:", fetchAll);
    
    // Hide buttons initially
    seeMoreStrategiesBtn.classList.add('d-none');
    hideStrategiesBtn.classList.add('d-none');

    // Clear existing content (this removes the message too)
    pastStrategiesContainer.innerHTML = '';
    isShowingAllStrategies = fetchAll;

    try {
        let url = `/investment-strategy/past-strategies`;
        const params = [];

        // Add filters to parameters array
        if (currentGoalFilter !== 'all') {
            params.push(`goal=${currentGoalFilter}`);
        }
        if (currentRiskFilter !== 'all') {
            params.push(`risk=${currentRiskFilter}`);
        }

        // Add limit parameter
        if (!fetchAll) {
            params.push(`limit=${INITIAL_STRATEGY_LIMIT}`);
        }

        // Construct the final URL with query parameters
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        console.log("Fetching from URL:", url);

        const response = await fetch(url);
        const data = await response.json();
        console.log("Data fetched:", data);

        // Check if we have strategies
        if (data.status === 'success' && data.data.strategies && data.data.strategies.length > 0) {
            strategiesCache = data.data.strategies;

            let strategiesToRender = strategiesCache;

            if (!fetchAll && data.totalCount > INITIAL_STRATEGY_LIMIT) {
                strategiesToRender = strategiesCache.slice(0, INITIAL_STRATEGY_LIMIT);
                seeMoreStrategiesBtn.classList.remove('d-none');
                console.log("See More button should be shown");
            } else if (fetchAll && data.totalCount > INITIAL_STRATEGY_LIMIT) {
                strategiesToRender = strategiesCache;
                hideStrategiesBtn.classList.remove('d-none');
                console.log("Hide Strategies button should be shown");
            } else {
                strategiesToRender = strategiesCache;
                console.log("Both buttons hidden");
            }

            // Render the strategies
            strategiesToRender.forEach(strategy => {
                const card = createStrategyCard(strategy);
                pastStrategiesContainer.appendChild(card);
            });
        } else {
            // No strategies found - recreate and show the message
            console.log("No strategies found, showing message");
            showNoStrategiesMessage('No past strategies found.');
        }
    } catch (error) {
        console.error('Error fetching past strategies:', error);
        // Show error message
        showNoStrategiesMessage('Failed to load past strategies. Please try again later.');
        window.toast.error('Failed to load past strategies.', 'error');
    }
}

// Helper function to show no strategies message
function showNoStrategiesMessage(messageText) {
    // Create the message element since it was cleared
    const messageDiv = document.createElement('div');
    messageDiv.className = 'col-12 p-3';
    messageDiv.id = 'noPastStrategiesMessage';
    
    const messageP = document.createElement('p');
    messageP.className = 'text-muted';
    messageP.textContent = messageText;
    
    messageDiv.appendChild(messageP);
    pastStrategiesContainer.appendChild(messageDiv);
}

// --- Start of Filter Logic ---
    const goalFilterDropdownButton = document.getElementById('goalFilterDropdown'); // Reference the button
    const riskFilterDropdownButton = document.getElementById('riskFilterDropdown'); // Reference the button

    // Event listener for Goal Filter Dropdown items
    document.querySelectorAll('#goalFilterDropdown + .dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const filterValue = this.dataset.filterGoal;
            const filterText = this.textContent;

            currentGoalFilter = filterValue;
            goalFilterDropdownButton.textContent = `Filter by Goal: ${filterText}`; // Update button text
            fetchAndDisplayPastStrategies(); // Re-fetch strategies with new filter
        });
    });

    // Event listener for Risk Filter Dropdown items
    document.querySelectorAll('#riskFilterDropdown + .dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const filterValue = this.dataset.filterRisk;
            const filterText = this.textContent;

            currentRiskFilter = filterValue;
            riskFilterDropdownButton.textContent = `Filter by Risk: ${filterText}`; // Update button text
            fetchAndDisplayPastStrategies(); // Re-fetch strategies with new filter
        });
    });

// Event Listener for "See More" Button
seeMoreStrategiesBtn.addEventListener('click', function() {
    seeMoreStrategiesBtn.disabled = true;
    seeMoreStrategiesBtn.textContent = 'Loading all strategies...';
    fetchAndDisplayPastStrategies(true)
        .finally(() => {
            seeMoreStrategiesBtn.disabled = false;
            seeMoreStrategiesBtn.textContent = 'See More Strategies';
        });
});

// Event Listener for "Hide Strategies" Button
hideStrategiesBtn.addEventListener('click', function() {
    hideStrategiesBtn.disabled = true;
    hideStrategiesBtn.textContent = 'Hiding strategies...';
    fetchAndDisplayPastStrategies(false) // Revert to showing initial 3
        .finally(() => {
            hideStrategiesBtn.disabled = false;
            hideStrategiesBtn.textContent = 'Hide Strategies';
        });
});


function updateRiskAnalyzerModal(strategy) {
    if (!strategy) {
        console.warn('No strategy provided to updateRiskAnalyzerModal.');
        document.getElementById('dynamicRiskLevel').textContent = 'N/A';
        document.getElementById('riskReturnAnalysistext').textContent = 'No detailed analysis available.';
        document.getElementById('recommendedStrategyText').textContent = 'No specific recommendation available.';
        
        // Clear "Your Strategy" point from chart if no strategy is present
        if (riskReturnChartInstance) {
            riskReturnChartInstance.data.datasets[3].data = [];
            riskReturnChartInstance.update();
        }
        return;
    }

    console.log("Risk vs analysis: ",strategy.strategyExplanation.riskReturnAnalysis);

    // Update text content
    const riskLevelText = strategy.riskLevel || 'N/A';
    document.getElementById('dynamicRiskLevel').textContent = riskLevelText;
    document.getElementById('riskReturnAnalysistext').textContent = strategy.strategyExplanation?.riskReturnAnalysis || 'No detailed risk-return analysis available for this strategy.';
    document.getElementById('recommendedStrategyText').textContent = strategy.strategyExplanation?.whyThisStrategy || 'No specific recommendation explanation available for this strategy.';

    // Update chart data
    if (riskReturnChartInstance) {
        let riskXValue = 0; // Default if riskLevel is not found
        // Map risk levels to X-axis values as defined in your chart data
        switch (strategy.riskLevel) {
            case 'Conservative':
                riskXValue = 5;
                break;
            case 'Moderate':
                riskXValue = 10;
                break;
            case 'Aggressive':
                riskXValue = 15;
                break;
            default:
                riskXValue = 0; // Handle unknown risk levels
        }

        const expectedReturnYValue = (strategy.expectedAnnualReturn *100).toFixed(2) || 0; // Default to 0 if not available

        // Update the 'Your Strategy' dataset
        riskReturnChartInstance.data.datasets[3].data = [{ x: riskXValue, y: expectedReturnYValue }];
        
        // Ensure "Your Strategy" label is accurate
        riskReturnChartInstance.data.datasets[3].label = `Your Strategy (${strategy.riskLevel})`;

        riskReturnChartInstance.update(); // Re-render the chart with updated data
    }
}

function displayStrategyComparison(strategyData) {
    const strategyComparisonContainer = document.getElementById('strategyComparisonContainer');
    
    if (!strategyComparisonContainer) {
        console.warn('Strategy comparison container not found');
        return;
    }

    if (!strategyData.strategyComparison) {
        console.warn('No strategy comparison data available');
        strategyComparisonContainer.style.display = 'none';
        return;
    }

    const comparison = strategyData.strategyComparison;
    const currentRiskLevel = strategyData.riskLevel;

    // Clear existing content
    strategyComparisonContainer.innerHTML = '';

    // Create the comparison HTML
    const comparisonHTML = `
        <div class="strategy-comparison-section bg-white">
    <h4 class="mb-4">Strategy Comparison</h4>
    <div class="row">
        ${Object.entries(comparison).map(([riskLevel, data]) => {

            const stocks = data[0].Stocks;
            const bonds = data[1].Bonds;
            const cash = data[2].Cash; 
            const other = data[3].Other;
            const expectedReturns = (data[4].Expectedreturns *100 ).toFixed(2);
            const isRecommended = riskLevel === currentRiskLevel;
            const borderLeftStyle = riskLevel === 'Conservative' ? 'border-left: 5px solid #4CAF50 !important;' : 
                                  riskLevel === 'Moderate' ? 'border-left: 5px solid #FF9800 !important;' : 'border-left: 5px solid #F44336 !important;';
            const badgeClass = riskLevel === 'Conservative' ? 'bg-success' : 
                                  riskLevel === 'Moderate' ? 'bg-warning text-dark' : 'bg-danger';
            
            console.log('Border Left Style for ', riskLevel, ': ', borderLeftStyle); // Debugging log
            console.log(stocks);

            return `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 border-0 bg-white shadow-sm" style="${borderLeftStyle} ${isRecommended ? 'border-left-width: 8px !important; box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;' : ''}">
                        <div class="card-header d-flex justify-content-between align-items-center bg-transparent pb-0">
                            <h5 class="mb-3">${riskLevel}</h5>
                            <div class="mb-3">
                                ${isRecommended ? '<span class="badge bg-primary">Recommended</span>' : ''}
                                <span class="badge ${badgeClass} ms-1">
                                    ${riskLevel === 'Conservative' ? 'Low Risk' : 
                                      riskLevel === 'Moderate' ? 'Medium Risk' : 'High Risk'}
                                </span>
                            </div>
                        </div>
                        <div class="card-body pt-2">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted">Stocks</span>
                                    <strong>${stocks}%</strong>
                                </div>
                                
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted">Bonds</span>
                                    <strong>${bonds}%</strong>
                                </div>
                                
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted">Cash</span>
                                    <strong>${cash}%</strong>
                                </div>
                                
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted">Other</span>
                                    <strong>${other}%</strong>
                                </div>
                                
                            </div>
                            
                            <hr>
                            
                            <div class="text-center">
                                <div class="text-muted small">Expected Return</div>
                                <div class="h4 mb-0 text-${riskLevel === 'Conservative' ? 'success' : 
                                      riskLevel === 'Moderate' ? 'warning' : 'danger'}">
                                    ${expectedReturns}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    </div>
</div>`;

    strategyComparisonContainer.innerHTML = comparisonHTML;
    strategyComparisonContainer.style.display = 'block';
}


function updateComparisonTable(strategyComparison, currentRiskLevel) {
    const tableBody = document.querySelector('.comparison-table tbody');
    console.log("strategyComparison:", strategyComparison);  // Log to check the structure of strategyComparison
    
    if (!tableBody || !strategyComparison) {
        console.error('Comparison table or strategy data not found');
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Define the order of strategies
    const strategies = ['Conservative', 'Moderate', 'Aggressive'];

    strategies.forEach(strategyType => {
        // Ensure we're accessing strategyComparison for each risk level
        const strategyDataArray = strategyComparison.strategyComparison[strategyType];  // Access the array for each strategy

        // Ensure that strategyDataArray has data
        console.log(`Checking strategyData for ${strategyType}:`, strategyDataArray);

        if (strategyDataArray && strategyDataArray.length > 0) {
            // Combine the objects in the array into a single object
            const strategyData = strategyDataArray.reduce((acc, currentValue) => {
                return { ...acc, ...currentValue };
            }, {});  // Reduce array to a single object

            const row = document.createElement('tr');
            
            // Highlight the current user's selected risk level
            if (strategyType === currentRiskLevel) {
                row.classList.add('highlight');
            }

            // Log strategy data to ensure we're accessing it correctly
            console.log("Data for strategyType:", strategyType);
            console.log("Volatility:", strategyData.Volatility);
            console.log("BestFor:", strategyData.BestFor);

            // Create the row content with the data
            row.innerHTML = `
                <td>${strategyType}</td>
                <td>${(strategyData.Expectedreturns *100 ).toFixed(2) || 0}%</td>  <!-- Expected Return -->
                <td>${strategyData.Volatility || 'N/A'}</td>    <!-- Volatility -->
                <td>${strategyData.BestFor || 'N/A'}</td>        <!-- Best For -->
            `;
            
            tableBody.appendChild(row);
        } else {
            console.log(`No data found for strategy: ${strategyType}`);
        }
    });
}

function updateComparisonOption(strategy) {
    // Removed the `!comparisonModal.classList.contains('show')` check here
    // because this function should be called *after* the modal is shown.
    // The previous error was a symptom of calling it *before* it's open.
    // Assuming this function is called via `shown.bs.modal` event, the modal IS open.

    const tableBody = document.querySelector('#comparisonToolModal #comparisonTableBody'); // Target by ID
    const recommendationSection = document.querySelector('#comparisonToolModal #recommendationSection'); // Target by ID
    const recommendationText = document.querySelector('#comparisonToolModal #recommendationText'); // Target by ID
    const noOptionsMessage = document.querySelector('#comparisonToolModal #noInvestmentOptionsMessage'); // Target by ID

    if (!tableBody) {
        console.error('Comparison table body not found in modal. Make sure tbody has id="comparisonTableBody" and is always rendered.');
        return;
    }

    // Clear existing rows and ensure sections are hidden initially
    tableBody.innerHTML = '';
    recommendationSection.style.display = 'none';
    recommendationText.textContent = '';
    noOptionsMessage.style.display = 'none';

    // Check if recommendedFunds exists and has data
    if (strategy && strategy.recommendedFunds && strategy.recommendedFunds.length > 0) {
        strategy.recommendedFunds.forEach(function(investment) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${investment.fundName || 'N/A'}</td>
                <td>${investment.RiskLevel || 'N/A'}</td>
                <td>${investment.MinimumInvestment || 'N/A'}</td>
                <td>${investment.Liquidity || 'N/A'}</td>
                <td>${investment.Fees || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        noOptionsMessage.style.display = 'block';
    }

    // Populate Recommendation
    if (strategy && strategy.Recommendation) {
        // Only show the recommendation section if there's content
        recommendationSection.style.display = 'block';
        recommendationText.textContent = strategy.Recommendation;
    }
    // If no recommendation, it remains hidden by default
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
                window.toast.warning('Please enter a valid non-negative Initial Investment.');
                initialInvestmentInput.focus();
                return;
            }
            if (isNaN(monthlyContribution) || monthlyContribution < 0) {
                window.toast.warning('Please enter a valid non-negative Monthly Contribution.');
                monthlyContributionInput.focus();
                return;
            }
            if (isNaN(annualReturn) || annualReturn < 0) {
                window.toast.warning('Please enter a valid non-negative Annual Return (percentage).');
                annualReturnInput.focus();
                return;
            }
            if (isNaN(investmentPeriod) || investmentPeriod <= 0) {
                window.toast.warning('Please enter a valid positive Investment Period (in years).');
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

    initializeAddGoalForm(showToast);
    fetchAndDisplayPastStrategies(false);
});

// You might want to export selectedGoalId or a getter function if other modules need it
export { currentGeneratedStrategy, riskAppetite, selectedGoalId };

