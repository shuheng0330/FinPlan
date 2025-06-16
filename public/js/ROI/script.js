// ROI Calculator Elements
const slider = document.getElementById("investmentPeriodRange");
const input = document.getElementById("sliderValue");
const roiForm = document.getElementById("roiForm");

// Stock Search Elements
const stockSymbolInput = document.getElementById('stockSymbol');
const searchButton = document.getElementById('searchButton');
const stockHintsDiv = document.getElementById('stockHints');

// Pop-up Elements (all content for stock details is now inside this pop-up)
const popupCard = document.getElementById('popupCard');
const closePopupBtn = document.getElementById('closePopupBtn');
const addInvestmentButton = document.getElementById('addInvestmentButton'); // Get reference to the Add Investment button

// References to elements *inside* the pop-up that will display stock data
const companyLogo = document.getElementById('companyLogo'); // New: for the logo
const companyName = document.getElementById('companyName');
const stockPrice = document.getElementById('stockPrice');
const stockChange = document.getElementById('stockChange');
const companyDescription = document.getElementById('companyDescription');
const sector = document.getElementById('sector');
const previousClose = document.getElementById('previousClose');
const stockOpen = document.getElementById('stockOpen');
const stockHigh = document.getElementById('stockHigh');
const stockLow = document = document.getElementById('stockLow');
const stockVolume = document.getElementById('stockVolume');
const stock52WeekHigh = document.getElementById('stock52WeekHigh');
const stock52WeekLow = document.getElementById('stock52WeekLow');
const marketCap = document.getElementById('marketCap');
const bookValue = document.getElementById('bookValue');
const eps = document.getElementById('eps');
const beta = document.getElementById('beta'); // This is the beta value from OVERVIEW
const ebitda = document.getElementById('ebitda');
const peRatio = document.getElementById('peRatio');
const dividendYield = document.getElementById('dividendYield');
const dayMovingAverage = document.getElementById('dayMovingAverage');

// Elements for Selected Stocks Section
const selectedStocksSection = document.getElementById('selectedStocksSection'); // The main container for the section
const selectedStocksContainer = document.getElementById('selectedStocksContainer'); // The .row where cards will be added

// --- NEW ---
const chartsContainer = document.getElementById('chartsContainer'); // Get the new charts container div
// --- END NEW ---

// Global array to store selected investments
let selectedInvestments = [];
const MAX_SELECTED_STOCKS = 10; // Maximum number of cards to display

// --- Chart Instances (Global) ---
let riskChartInstance = null;
let returnChartInstance = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
    // ROI Calculator setup
    if (slider && input) {
        slider.addEventListener("input", () => {
            input.value = slider.value;
        });
        input.addEventListener("input", () => {
            const val = parseInt(input.value);
            if (val >= 1 && val <= 50) {
                slider.value = val;
            }
        });
    }
    if (roiForm) {
        roiForm.addEventListener("submit", handleROISubmit);
    }

    // Add event listeners for stock search and hints
    if (stockSymbolInput && searchButton && stockHintsDiv) {
        stockSymbolInput.addEventListener('input', handleSearchInput);
        searchButton.addEventListener('click', () => fetchStockData(stockSymbolInput.value));

        stockHintsDiv.addEventListener('click', handleHintClick);

        document.addEventListener('click', function(event) {
            if (!stockSymbolInput.contains(event.target) && !stockHintsDiv.contains(event.target)) {
                hideHints();
            }
        });
    }

    // Pop-up close listeners
    if (popupCard && closePopupBtn) {
        closePopupBtn.addEventListener('click', closePopup);
        popupCard.addEventListener('click', function(event) {
            if (event.target === popupCard) {
                closePopup();
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && popupCard.classList.contains('show')) {
                closePopup();
            }
        });
    }

    // Event listener for the "Add Investment" button in the pop-up
    if (addInvestmentButton) {
        addInvestmentButton.addEventListener('click', AddInvestment);
    }

    // Initial render of selected stocks and charts (will be empty on first load)
    renderSelectedStocks();
    updateCharts(); // Call charts on load too
});

// ROI Calculator Function (unchanged)
function handleROISubmit(e) {
    e.preventDefault();
    const initialInvestment = parseFloat(document.getElementById("initialInvestment").value);
    const finalValue = parseFloat(document.getElementById("finalValue").value);
    const years = parseInt(input.value);

    if (isNaN(initialInvestment) || isNaN(finalValue) || isNaN(years) ||
        initialInvestment <= 0 || years <= 0) {
        alert("Please enter valid numbers. Initial investment must be > 0 and years must be >= 1.");
        return;
    }
    const gain = finalValue - initialInvestment;
    const roi = (gain / initialInvestment) * 100;
    const annualizedROI = ((finalValue / initialInvestment) ** (1 / years) - 1) * 100;

    document.getElementById("roiValue").innerText = `$${gain.toFixed(2)} gain over ${years} year(s)`;
    document.getElementById("roiPercentage").innerHTML =
        `${roi.toFixed(2)}% total ROI<br>${annualizedROI.toFixed(2)}% annualized`;
}


// ------------------- Stock Data Functions -------------------
const apiKey = "24WFSJXQ4N24BBBR"; // Replace with your Alpha Vantage API Key

// Define your allowed stock symbols with mock data for pop-up descriptions and LOGO PATHS
const allowedStocks = [
    { symbol: "AAPL", name: "Apple Inc.", description: "A technology company that designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.", logo_path: "/svgs/Xiang/aapl.png" }, // Updated path
    { symbol: "NVDA", name: "NVIDIA Corp", description: "A multinational technology company that designs graphics processing units (GPUs) for the gaming and professional markets, as well as chipsets for mobile computing and automotive markets.", logo_path: "/svgs/Xiang/nvda.png" }, // Updated path
    { symbol: "TSLA", name: "Tesla, Inc.", description: "Designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.", logo_path: "/svgs/Xiang/tsla.png" }, // Updated path
    { symbol: "AMZN", name: "Amazon.com, Inc.", description: "An American multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence.", logo_path: "/svgs/Xiang/amzn.png" }, // Updated path
    { symbol: "GOOGL", name: "Alphabet Inc.", description: "A multinational technology conglomerate. Google, its main subsidiary, specializes in Internet-related services and products, which include online advertising technologies, a search engine, cloud computing, software, and hardware.", logo_path: "/svgs/Xiang/googl.png" }, // Updated path
    { symbol: "WMT", name: "Walmart Inc.", description: "An American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores.", logo_path: "/svgs/Xiang/wmt.png" }, // Updated path
    { symbol: "MSFT", name: "Microsoft Corp", description: "A multinational technology corporation that produces computer software, consumer electronics, personal computers, and related services.", logo_path: "/svgs/Xiang/msft.png" }, // Updated path
    { symbol: "META", name: "Meta Platforms, Inc.", description: "Focuses on building technologies that help people connect, find communities and grow businesses. It operates Facebook, Instagram, Messenger, and WhatsApp.", logo_path: "/svgs/Xiang/meta.png" }, // Updated path
    { symbol: "JPM", name: "JPMorgan Chase & Co.", description: "A multinational financial services firm. It is the largest bank in the United States by assets.", logo_path: "/svgs/Xiang/jpm.png" }, // Updated path
    { symbol: "KO", name: "The Coca-Cola Company", description: "A multinational beverage corporation best known as the producer of Coca-Cola.", logo_path: "/svgs/Xiang/ko.png" }  // Updated path
];


// --- Search Hint Functions (RESTORED) ---

function displayHints(hints) {
    stockHintsDiv.innerHTML = '';
    if (hints.length === 0) {
        stockHintsDiv.classList.remove('active');
        return;
    }
    const ul = document.createElement('ul');
    hints.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.symbol} - ${item.name}`;
        li.dataset.symbol = item.symbol;
        ul.appendChild(li);
    });
    stockHintsDiv.appendChild(ul);
    stockHintsDiv.classList.add('active');
}

function hideHints() {
    stockHintsDiv.classList.remove('active');
    stockHintsDiv.innerHTML = '';
}

function handleSearchInput() {
    const query = stockSymbolInput.value.toLowerCase().trim();
    if (query.length === 0) {
        hideHints();
        return;
    }
    const filteredHints = allowedStocks.filter(item =>
        item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
    );
    displayHints(filteredHints);
}

async function handleHintClick(event) {
    const clickedElement = event.target;
    if (clickedElement.tagName === 'LI' && clickedElement.dataset.symbol) {
        const selectedSymbol = clickedElement.dataset.symbol;
        stockSymbolInput.value = selectedSymbol;
        hideHints();

        await fetchStockData(selectedSymbol);
    }
}

// --- Pop-up Functions (unchanged) ---
function openPopup() {
    if (popupCard) {
        popupCard.classList.add('show');
    }
}

function closePopup() {
    if (popupCard) {
        popupCard.classList.remove('show');
        stockSymbolInput.value = ''; // Clear search input
        clearStockDisplay(); // Clear displayed data when pop-up closes
    }
}

// --- Fetch Stock Data Function (Modified to store change percent and beta) ---
let currentFetchedStockData = {}; // Temp storage for data needed by AddInvestment

async function fetchStockData(symbol) {
    if (!symbol) {
        symbol = stockSymbolInput.value.toUpperCase();
    }

    if (!symbol) {
        alert("Please enter a stock symbol to search.");
        return;
    }

    const selectedStockDefinition = allowedStocks.find(item => item.symbol === symbol);
    if (!selectedStockDefinition) {
        alert(`Searching for '${symbol}' is not allowed. Please select from the suggestions.`);
        hideHints();
        clearStockDisplay();
        return;
    }

    clearStockDisplay();
    currentFetchedStockData = {}; // Clear previous fetched data

    if (companyLogo && selectedStockDefinition.logo_path) {
        companyLogo.src = selectedStockDefinition.logo_path;
        companyLogo.alt = `${selectedStockDefinition.name} Logo`;
        companyLogo.style.display = 'block';
    } else {
        companyLogo.src = "";
        companyLogo.style.display = 'none';
    }

    try {
        // Fetch Real-Time Stock Data
        const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const stockResponse = await fetch(stockUrl);
        const stockData = await stockResponse.json();

        if (!stockData["Global Quote"] || Object.keys(stockData["Global Quote"]).length === 0) {
            alert("No real-time data found for this stock symbol. It might be invalid or API limit exceeded.");
            companyLogo.style.display = 'none';
            return;
        }

        const stock = stockData["Global Quote"];
        const changeValue = parseFloat(stock["09. change"]);
        const changePercent = parseFloat(stock["10. change percent"].replace('%', '')); // Parse as number

        stockPrice.innerText = `$${parseFloat(stock["05. price"]).toFixed(2)}`;
        stockChange.innerText = `${changeValue.toFixed(2)} (${changePercent.toFixed(2)}%)`; // Re-add % for display
        stockChange.className = 'stock-change';
        if (changeValue >= 0) {
            stockChange.classList.add('positive');
        } else {
            stockChange.classList.add('negative');
        }
        stockOpen.innerText = `$${parseFloat(stock["02. open"]).toFixed(2)}`;
        stockHigh.innerText = `$${parseFloat(stock["03. high"]).toFixed(2)}`;
        stockLow.innerText = `$${parseFloat(stock["04. low"]).toFixed(2)}`;
        stockVolume.innerText = `${stock["06. volume"]}`;
        previousClose.innerText = `$${parseFloat(stock["08. previous close"]).toFixed(2)}`;

        // Fetch Additional Company Information
        const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
        const overviewResponse = await fetch(overviewUrl);
        const overviewData = await overviewResponse.json();

        let fetchedBeta = null; // Default to null
        let fetchedSector = null; // Default to null

        if (overviewData && Object.keys(overviewData).length > 0) {
            companyName.innerText = overviewData["Name"] || selectedStockDefinition.name || "Company Name Not Available";
            companyDescription.innerText = overviewData["Description"] || selectedStockDefinition.description || "No description available.";
            stock52WeekHigh.innerText = `$${overviewData["52WeekHigh"]}`;
            stock52WeekLow.innerText = `$${overviewData["52WeekLow"]}`;
            marketCap.innerText = `$${(parseFloat(overviewData["MarketCapitalization"]) / 1e9).toFixed(2)}B`;
            peRatio.innerText = overviewData["PERatio"];
            dividendYield.innerText = `${(parseFloat(overviewData["DividendYield"]) * 100).toFixed(2)}%`;
            sector.innerText = `${overviewData["Sector"]}`;
            bookValue.innerText = `${overviewData["BookValue"]}`;
            eps.innerText = `${overviewData["EPS"]}`;
            ebitda.innerText = `${(parseFloat(overviewData["EBITDA"]) / 1e9).toFixed(2)}B`;
            beta.innerText = `${overviewData["Beta"]}`; // Display beta on the popup
            dayMovingAverage.innerText = `${overviewData["200DayMovingAverage"]}`;

            // Store fetched data for AddInvestment
            fetchedBeta = parseFloat(overviewData["Beta"]);
            fetchedSector = overviewData["Sector"]; // Also store sector if needed for future charts
        } else {
            companyName.innerText = selectedStockDefinition.name || "Company Name Not Available";
            companyDescription.innerText = selectedStockDefinition.description || "No description available.";
            console.warn("No overview data available for " + symbol + ", using fallback description.");
            stock52WeekHigh.innerText = "-"; stock52WeekLow.innerText = "-";
            marketCap.innerText = "-"; peRatio.innerText = "-";
            dividendYield.innerText = "-"; sector.innerText = "-";
            bookValue.innerText = "-"; eps.innerText = "-";
            ebitda.innerText = "-"; beta.innerText = "-";
            dayMovingAverage.innerText = "-";
        }

        // Store data to be used by AddInvestment
        currentFetchedStockData = {
            symbol: symbol,
            name: companyName.innerText, // Use the potentially fallback name
            price: parseFloat(stock["05. price"]),
            change: changeValue,
            changePercent: changePercent, // Store as number for charts
            changeClass: stockChange.classList.contains('positive') ? 'positive' : (stockChange.classList.contains('negative') ? 'negative' : ''),
            logo: companyLogo.src, // Store the path to the logo
            beta: fetchedBeta // Store beta as number for charts
        };

        openPopup();

    } catch (error) {
        console.error("Error fetching stock data:", error);
        alert("Error fetching stock data. Please try again later.");
        clearStockDisplay();
    }
}

function clearStockDisplay() {
    companyName.innerText = ""; companyDescription.innerText = "";
    stockPrice.innerText = "-"; stockChange.innerText = "-";
    stockChange.className = 'stock-change';
    stockOpen.innerText = "-"; stockHigh.innerText = "-";
    stockLow.innerText = "-"; stockVolume.innerText = "-";
    previousClose.innerText = "-"; stock52WeekHigh.innerText = "-";
    stock52WeekLow.innerText = "-"; marketCap.innerText = "-";
    peRatio.innerText = "-"; dividendYield.innerText = "-";
    sector.innerText = "-"; bookValue.innerText = "-";
    eps.innerText = "-"; ebitda.innerText = "-";
    beta.innerText = "-"; dayMovingAverage.innerText = "-"; // Clear beta display
    if (companyLogo) { companyLogo.src = ""; companyLogo.alt = "Company Logo"; companyLogo.style.display = 'none'; }

    currentFetchedStockData = {}; // Clear temp storage
}

// ------------------- Selected Investments Logic (Modified for chart data) -------------------

function AddInvestment() {
    // Use data from currentFetchedStockData, which was populated by fetchStockData
    const newInvestment = currentFetchedStockData;

    if (!newInvestment.symbol || !newInvestment.name || newInvestment.price === undefined || !newInvestment.logo) {
        alert("Please search for a valid stock and ensure its data is loaded before adding.");
        return;
    }

    const isDuplicate = selectedInvestments.some(investment => investment.symbol === newInvestment.symbol);
    if (isDuplicate) {
        alert(`${newInvestment.name} (${newInvestment.symbol}) is already in your selected investments.`);
        closePopup();
        return;
    }

    if (selectedInvestments.length >= MAX_SELECTED_STOCKS) {
        alert(`You can only select up to ${MAX_SELECTED_STOCKS} investments.`);
        closePopup();
        return;
    }

    selectedInvestments.push(newInvestment);
    renderSelectedStocks(); // Update cards
    updateCharts(); // Update charts
    closePopup(); // Close the pop-up
}

function removeInvestment(symbolToRemove) {
    selectedInvestments = selectedInvestments.filter(investment => investment.symbol !== symbolToRemove);
    renderSelectedStocks(); // Update cards
    updateCharts(); // Update charts
}

function renderSelectedStocks() {
    selectedStocksContainer.innerHTML = '';

    if (selectedInvestments.length === 0) {
        selectedStocksSection.classList.add('d-none');
    } else {
        selectedStocksSection.classList.remove('d-none');
    }

    selectedInvestments.forEach(investment => {
        // Format price and change for card display
        const displayPrice = `$${investment.price.toFixed(2)}`;
        const displayChange = `${investment.change.toFixed(2)} (${investment.changePercent.toFixed(2)}%)`;

        const cardHtml = `
            <div class="col-md-3 mb-3">
                <div class="p-3 bg-white rounded shadow-sm h-100 d-flex flex-column justify-content-between">
                    <div class="d-flex align-items-center mb-2">
                        <img src="${investment.logo}" alt="${investment.name} logo" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                        <span class="fw-semibold">${investment.name}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <p class="mb-0 fw-bold">${displayPrice}</p>
                        <span class="badge rounded-pill p-2 ${investment.changeClass}">${displayChange}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary mt-3 remove-investment-btn" data-symbol="${investment.symbol}">Remove</button>
                </div>
            </div>
        `;
        selectedStocksContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

    document.querySelectorAll('.remove-investment-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const symbol = event.target.dataset.symbol;
            removeInvestment(symbol);
        });
    });
}

// ------------------- Chart Logic (NEW) -------------------

function updateCharts() {
    // Get data for charts
    const stockSymbols = selectedInvestments.map(inv => inv.symbol);
    const dailyReturns = selectedInvestments.map(inv => inv.changePercent); // Use changePercent for return
    const betaValues = selectedInvestments.map(inv => inv.beta); // Use beta for risk/volatility

    // --- NEW ---
    if (selectedInvestments.length === 0) {
        chartsContainer.classList.add('d-none'); // Hide the entire charts container if no stocks
        // Destroy charts if they exist when hiding the container
        if (riskChartInstance) {
            riskChartInstance.destroy();
            riskChartInstance = null; // Important: nullify the instance
        }
        if (returnChartInstance) {
            returnChartInstance.destroy();
            returnChartInstance = null; // Important: nullify the instance
        }
        return; // Exit the function, no charts to draw
    } else {
        chartsContainer.classList.remove('d-none'); // Show the charts container if stocks exist
    }
    // --- END NEW ---

    // Get canvas contexts
    const riskCtx = document.getElementById('RiskChart').getContext('2d');
    const returnCtx = document.getElementById('ReturnChart').getContext('2d');

    // Destroy existing chart instances if they exist
    if (riskChartInstance) {
        riskChartInstance.destroy();
    }
    if (returnChartInstance) {
        returnChartInstance.destroy();
    }

    // --- Create Risk Chart (Beta) ---
    riskChartInstance = new Chart(riskCtx, {
        type: 'bar',
        data: {
            labels: stockSymbols,
            datasets: [{
                label: 'Beta (Risk Level)',
                data: betaValues,
                backgroundColor: betaValues.map(beta => beta > 1 ? 'rgba(255, 99, 132, 0.7)' : (beta < 0.8 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 206, 86, 0.7)')), // Red for high risk, Green for low, Yellow for moderate
                borderColor: betaValues.map(beta => beta > 1 ? 'rgba(255, 99, 132, 1)' : (beta < 0.8 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 206, 86, 1)')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Stock Beta (Risk Level vs. Market)',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw !== null ? context.raw.toFixed(2) : 'N/A'}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Beta Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Stock Symbol'
                    }
                }
            }
        }
    });

    // --- Create Return Chart (Daily Change %) ---
    returnChartInstance = new Chart(returnCtx, {
        type: 'bar',
        data: {
            labels: stockSymbols,
            datasets: [{
                label: 'Daily Return (%)',
                data: dailyReturns,
                backgroundColor: dailyReturns.map(ret => ret >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'), // Green for positive, Red for negative
                borderColor: dailyReturns.map(ret => ret >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Return Percentage',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw !== null ? context.raw.toFixed(2) : 'N/A'}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false, // Can go negative
                    title: {
                        display: true,
                        text: 'Return (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Stock Symbol'
                    }
                }
            }
        }
    });
}
