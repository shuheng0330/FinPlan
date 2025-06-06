import { initializeAddGoalForm } from '/js/common-add-goal-logic.js'; // Adjust path if needed

let selectedGoalId = null; // Variable to store the ID of the selected goal
let riskAppetite = 'Moderate';
let allocationChartInstance = null;
let currentGeneratedStrategy = null;

let modealAllocationChartInstance = null;
let strategyDetailModal;

const INITIAL_STRATEGY_LIMIT = 3;
let strategiesCache = [];
let isShowingAllStrategies = false;

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

    // Action Buttons
    const regenerateBtn = document.getElementById('regenerateBtn');
    const downloadStrategyBtn = document.getElementById('downloadStrategyBtn');
    const implementStrategyBtn = document.getElementById('implementStrategyBtn');

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

                        strategyDisplaySection.style.display = 'block'; // Show the strategy display section
                         showToast('Strategy generated successfully!', 'success');

                        // Enable action buttons
                        downloadStrategyBtn.disabled = false;
                        implementStrategyBtn.disabled = false;
                        regenerateBtn.disabled = false;

                    } else {
                        showToast('Generated strategy data is empty.', 'error');
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Error generating strategy:', errorData);
                    showToast('Failed to generate strategy: ' + (errorData.message || 'Something went wrong.'), 'error'); // Replaced alert
                }
            } catch (error) {
                console.error('Network error during strategy generation:', error);
                showToast('Could not connect to the server to generate strategy. Please check your internet connection.', 'error'); // Replaced alert
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
                showToast('error', 'Please select a goal first to generate a PDF.');
                return;
            }
            if (!riskAppetite) {
                showToast('error', 'Risk appetite is not set. Please generate a strategy first.');
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
                    showToast('Download successfully', 'success');
                } else {
                    const errorData = await response.json();
                    console.error('Error downloading PDF:', errorData);
                    showToast('error', `Failed to download PDF: ${errorData.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Network error during PDF download:', error);
                showToast('error', 'Network error or unexpected issue during PDF download.');
            }
        });
    }

    if (implementStrategyBtn) {
        implementStrategyBtn.addEventListener('click', async function() {
            console.log('Implement Strategy clicked');
            console.log('selectedGoalId:', selectedGoalId);
            console.log('currentGeneratedStrategy:', currentGeneratedStrategy);

            if(!selectedGoalId || !currentGeneratedStrategy){
                showToast('Please generate an investment strategy first.','error');
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
                    showToast('Investment strategy saved successfully!','success');
                }else{
                    showToast('Failed to save investment strategy. Unknown error.', 'error');
                }
            }catch (error){
                console.error('Error saving strategy:',error);
                showToast('An unexpected error occurred while saving the strategy.','error');
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
                    <strong>Expected Return:</strong> ${strategy.expectedAnnualReturn ? strategy.expectedAnnualReturn.toFixed(3) : 'N/A'}%<br>
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

    // Function to display strategy details in the modal (the "enlarged" view)
    function showStrategyDetailsModal(strategy) {
        document.getElementById('modalGoalName').textContent = strategy.goal && strategy.goal.goalName ? strategy.goal.goalName : 'N/A';
        document.getElementById('modalRiskLevel').textContent = strategy.riskLevel || 'N/A';
        document.getElementById('modalInvestmentHorizon').textContent = strategy.investmentHorizon || 'N/A';
        document.getElementById('modalExpectedAnnualReturn').textContent = strategy.expectedAnnualReturn ? strategy.expectedAnnualReturn.toFixed(3) : 'N/A';
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

      // Function to fetch and display initial past strategies on page load
    async function fetchAndDisplayPastStrategies(fetchAll = false) {
        console.log("Fetching strategies, fetchAll:", fetchAll);
        //we using d-none, so that we can remove it
        seeMoreStrategiesBtn.classList.add('d-none');
        hideStrategiesBtn.classList.add('d-none');

        pastStrategiesContainer.innerHTML = ''; // Clear existing cards
        noPastStrategiesMessage.style.display = 'none'; // Hide no strategies message by default
        seeMoreStrategiesBtn.style.display = ''; // Initially hide "See More" button
        hideStrategiesBtn.style.display = ''; // Initially hide "Hide Strategies" button
        isShowingAllStrategies = fetchAll;

    try {
        let url = `/investment-strategy/past-strategies`;
        if (!fetchAll) {
            url += `?limit=${INITIAL_STRATEGY_LIMIT}`;
        }
        console.log("Fetching from URL:", url); // Log the URL for the API request

        const response = await fetch(url);
        const data = await response.json();
        console.log("Data fetched:", data); // Log the response data

        if (data.status === 'success' && data.data.strategies.length > 0) {
            strategiesCache = data.data.strategies;

            let strategiesToRender = strategiesCache;

            if (!fetchAll && data.totalCount > INITIAL_STRATEGY_LIMIT) {
                // If not fetching all, and there are more than the initial limit,
                // slice the cache to show only the initial limit.
                strategiesToRender = strategiesCache.slice(0, INITIAL_STRATEGY_LIMIT);
                seeMoreStrategiesBtn.classList.remove('d-none'); // Show "See More" button
                console.log("See More button should be shown");
            } else if (fetchAll && data.totalCount > INITIAL_STRATEGY_LIMIT) {
                // If fetching all, show all strategies
                strategiesToRender = strategiesCache;
                hideStrategiesBtn.classList.remove('d-none'); // Show "Hide Strategies" button
                console.log("Hide Strategies button should be shown");
            } else {
                // Scenario: Either only a few strategies, no need for both buttons
                strategiesToRender = strategiesCache;
                console.log("Both buttons hidden");
            }

            strategiesToRender.forEach(strategy => {
                const card = createStrategyCard(strategy);
                pastStrategiesContainer.appendChild(card);
            });
        } else {
            noPastStrategiesMessage.style.display = 'block'; // Show message if no strategies
            noPastStrategiesMessage.textContent = 'No past strategies found.'
        }
    } catch (error) {
        console.error('Error fetching past strategies:', error);
        noPastStrategiesMessage.style.display = 'block'; // Show message on error
        noPastStrategiesMessage.textContent = 'Failed to load past strategies. Please try again later.';
        showToast('Failed to load past strategies.', 'error');
    }
}

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

    initializeAddGoalForm(showToast);
    fetchAndDisplayPastStrategies(false);
});

// You might want to export selectedGoalId or a getter function if other modules need it
export { selectedGoalId, riskAppetite, currentGeneratedStrategy };