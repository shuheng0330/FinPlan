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
const stockLow = document.getElementById('stockLow');
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

// Charts Container
const chartsContainer = document.getElementById('chartsContainer'); // Get the new charts container div

// Global array to store selected investments
let selectedInvestments = [];
const MAX_SELECTED_STOCKS = 10; // Maximum number of cards to display

// --- Chart Instances (Global) ---
let riskChartInstance = null;
let returnChartInstance = null;

// Global variable to hold the fetched stock data before adding to comparison
// This is CRITICAL for the AddInvestment function to know what stock to add.
let currentFetchedStockData = null; // Initialize as null

// Reference to the toast container
const toastContainer = document.querySelector('.toast-container');

// --- Custom Toast Alert Function ---
// This function dynamically creates and displays toast notifications
function showCustomToast(type, title, message, duration = 3000) {
    if (!toastContainer) {
        console.error('Toast container not found!');
        return; // Cannot show toast without container
    }

    const toastId = `toast-${Date.now()}`; // Unique ID for each toast
    const iconMap = {
        'success': 'check-circle',
        'error': 'x-circle',
        'warning': 'alert-triangle',
        'info': 'info',
        'question': 'help-circle' // Using Lucide 'help-circle' for 'question'
    };
    const iconSvg = iconMap[type] || 'info'; // Default to info icon if type is unknown

    // Create a temporary div to parse HTML, so we can ensure icons are processed before appending
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
        <div id="${toastId}" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i data-lucide="${iconSvg}" class="toast-icon"></i>
                <strong class="me-auto text-capitalize">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    const newToast = tempDiv.firstElementChild; // Get the toast element from the tempDiv

    // IMPORTANT: Call lucide.createIcons on the newToast element ONLY before appending
    // This processes icons specifically for this toast, preventing global re-render conflicts.
    lucide.createIcons({
        container: newToast // Limit icon creation to just this new toast element
    });

    // Append the toast to the container
    toastContainer.appendChild(newToast);

    // Trigger the show animation
    setTimeout(() => {
        newToast.classList.add('show');
    }, 10); // Small delay to allow DOM to render before adding 'show' class

    // Auto-hide the toast after 'duration'
    setTimeout(() => {
        newToast.classList.remove('show');
        // Remove toast from DOM after animation completes (0.3s for transition)
        setTimeout(() => {
            newToast.remove();
        }, 300); // This duration should match your CSS transition for opacity/transform
    }, duration);

    // Add event listener for manual close button
    newToast.querySelector('.btn-close')?.addEventListener('click', () => {
        newToast.classList.remove('show');
        setTimeout(() => {
            newToast.remove();
        }, 300);
    });
}


// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
    // ROI Calculator setup
    if (slider && input) {
        slider.addEventListener("input", () => {
            input.value = slider.value;
        });
        input.addEventListener("input", () => {
            const val = parseInt(input.value);
            if (!isNaN(val) && val >= 1 && val <= 50) {
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
        closePopupBtn.addEventListener('click', () => {
            closePopup(true); // Indicate it's a user-initiated close, clear currentFetchedStockData
        });
        popupCard.addEventListener('click', function(event) {
            if (event.target === popupCard) {
                closePopup(true); // Indicate it's a user-initiated close, clear currentFetchedStockData
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && popupCard.classList.contains('show')) {
                closePopup(true); // Indicate it's a user-initiated close, clear currentFetchedStockData
            }
        });
    }

    // Event listener for the "Add Investment" button in the pop-up
    // Ensure this is attached ONLY ONCE
    if (addInvestmentButton) {
        addInvestmentButton.addEventListener('click', AddInvestment);
    }

    // Initial render of selected stocks and charts (will be empty on first load)
    renderSelectedStocks();
    updateCharts();
});

// ROI Calculator Function
function handleROISubmit(e) {
    e.preventDefault();
    const initialInvestment = parseFloat(document.getElementById("initialInvestment").value);
    const finalValue = parseFloat(document.getElementById("finalValue").value);
    const years = parseInt(input.value);

    if (isNaN(initialInvestment) || isNaN(finalValue) || isNaN(years) ||
        initialInvestment <= 0 || years <= 0) {
        showCustomToast('error', 'Input Error', 'Please enter valid numbers. Initial investment must be greater than 0 and years must be 1 or more.');
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
// Using a mock API key, replace with your actual Alpha Vantage API Key
const apiKey = "6ZPIUPMEUE9295ZA";

// Define your allowed stock symbols with mock data for pop-up descriptions and LOGO PATHS
const allowedStocks = [
    { symbol: "AAPL", name: "Apple Inc.", description: "A technology company that designs, manufactures and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.", logo_path: "/svgs/Xiang/aapl.png" },
    { symbol: "NVDA", name: "NVIDIA Corp", description: "A multinational technology company that designs graphics processing units (GPUs) for the gaming and professional markets, as well as chipsets for mobile computing and automotive markets.", logo_path: "/svgs/Xiang/nvda.png" },
    { symbol: "TSLA", name: "Tesla, Inc.", description: "Designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.", logo_path: "/svgs/Xiang/tsla.png" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", description: "An American multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence.", logo_path: "/svgs/Xiang/amzn.png" },
    { symbol: "GOOGL", name: "Alphabet Inc.", description: "A multinational technology conglomerate. Google, its main subsidiary, specializes in Internet-related services and products, which include online advertising technologies, a search engine, cloud computing, software, and hardware.", logo_path: "/svgs/Xiang/googl.png" },
    { symbol: "WMT", name: "Walmart Inc.", description: "An American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores.", logo_path: "/svgs/Xiang/wmt.png" },
    { symbol: "MSFT", name: "Microsoft Corp", description: "A multinational technology corporation that produces computer software, consumer electronics, personal computers, and related services.", logo_path: "/svgs/Xiang/msft.png" },
    { symbol: "META", name: "Meta Platforms, Inc.", description: "Focuses on building technologies that help people connect, find communities and grow businesses. It operates Facebook, Instagram, Messenger, and WhatsApp.", logo_path: "/svgs/Xiang/meta.png" },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", description: "A multinational financial services firm. It is the largest bank in the United States by assets.", logo_path: "/svgs/Xiang/jpm.png" },
    { symbol: "KO", name: "The Coca-Cola Company", description: "A multinational beverage corporation best known as the producer of Coca-Cola.", logo_path: "/svgs/Xiang/ko.png" }
];


// --- Search Hint Functions ---

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

async function handleSearchInput() {
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

        currentFetchedStockData = null; // Clear any previously loaded stock data before new fetch
        await fetchStockData(selectedSymbol);
    }
}

// --- Pop-up Functions ---
function openPopup() {
    if (popupCard) {
        popupCard.classList.add('show');
    }
}

// Modified closePopup to control clearing currentFetchedStockData
function closePopup(userInitiated = false) {
    if (popupCard) {
        popupCard.classList.remove('show');
        stockSymbolInput.value = ''; // Clear search input
        clearStockDisplay(); // Clear displayed data when pop-up closes

        // ONLY clear currentFetchedStockData if the user manually closed the popup
        // or if it's not being closed as part of the AddInvestment process.
        if (userInitiated) {
            currentFetchedStockData = null;
        }
    }
}

// --- Fetch Stock Data Function ---
async function fetchStockData(symbol) {
    currentFetchedStockData = null; // Always clear at the start of a new fetch

    if (!symbol) {
        showCustomToast('warning', 'Missing Symbol', 'Please enter a stock symbol to search.');
        clearStockDisplay();
        return;
    }

    const selectedStockDefinition = allowedStocks.find(item => item.symbol === symbol);
    if (!selectedStockDefinition) {
        showCustomToast('info', 'Symbol Not Allowed', `Searching for '${symbol}' is not allowed. Please select from the predefined suggestions.`);
        hideHints();
        clearStockDisplay();
        return;
    }

    clearStockDisplay();

    if (companyLogo && selectedStockDefinition.logo_path) {
        companyLogo.src = selectedStockDefinition.logo_path;
        companyLogo.alt = `${selectedStockDefinition.name} Logo`;
        companyLogo.style.display = 'block';
    } else {
        companyLogo.src = "";
        companyLogo.style.display = 'none';
    }

    try {
        const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const stockResponse = await fetch(stockUrl);
        const stockData = await stockResponse.json();

        if (!stockData["Global Quote"] || Object.keys(stockData["Global Quote"]).length === 0) {
            showCustomToast('error', 'Data Not Found', 'No real-time data found for this stock symbol. It might be invalid or the API limit has been exceeded.', 5000);
            companyLogo.style.display = 'none';
            return;
        }

        const stock = stockData["Global Quote"];
        const changeValue = parseFloat(stock["09. change"]);
        const changePercent = parseFloat(stock["10. change percent"].replace('%', ''));

        stockPrice.innerText = `$${parseFloat(stock["05. price"]).toFixed(2)}`;
        stockChange.innerText = `${changeValue.toFixed(2)} (${changePercent.toFixed(2)}%)`;
        stockChange.className = 'stock-change';
        if (changeValue >= 0) {
            stockChange.classList.add('positive');
        } else {
            stockChange.classList.add('negative');
        }
        stockOpen.innerText = `$${parseFloat(stock["02. open"]).toFixed(2)}`;
        stockHigh.innerText = `$${parseFloat(stock["03. high"]).toFixed(2)}`;
        stockLow.innerText = `$${parseFloat(stock["04. low"]).toFixed(2)}`;
        stockVolume.innerText = `${parseInt(stock["06. volume"]).toLocaleString()}`;
        previousClose.innerText = `$${parseFloat(stock["08. previous close"]).toFixed(2)}`;

        const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
        const overviewResponse = await fetch(overviewUrl);
        const overviewData = await overviewResponse.json();

        let fetchedBeta = null;
        let fetchedSector = null;

        if (overviewData && Object.keys(overviewData).length > 0) {
            companyName.innerText = overviewData["Name"] || selectedStockDefinition.name || "Company Name Not Available";
            companyDescription.innerText = overviewData["Description"] || selectedStockDefinition.description || "No description available.";
            stock52WeekHigh.innerText = `$${parseFloat(overviewData["52WeekHigh"]).toFixed(2)}`;
            stock52WeekLow.innerText = `$${parseFloat(overviewData["52WeekLow"]).toFixed(2)}`;
            marketCap.innerText = `$${(parseFloat(overviewData["MarketCapitalization"]) / 1e9).toFixed(2)}B`;
            peRatio.innerText = overviewData["PERatio"] !== "None" ? parseFloat(overviewData["PERatio"]).toFixed(2) : "-";
            dividendYield.innerText = overviewData["DividendYield"] !== "None" ? `${(parseFloat(overviewData["DividendYield"]) * 100).toFixed(2)}%` : "-";
            sector.innerText = `${overviewData["Sector"]}`;
            bookValue.innerText = overviewData["BookValue"] !== "None" ? parseFloat(overviewData["BookValue"]).toFixed(2) : "-";
            eps.innerText = overviewData["EPS"] !== "None" ? parseFloat(overviewData["EPS"]).toFixed(2) : "-";
            ebitda.innerText = overviewData["EBITDA"] !== "None" ? `$${(parseFloat(overviewData["EBITDA"]) / 1e9).toFixed(2)}B` : "-";
            beta.innerText = overviewData["Beta"] !== "None" ? parseFloat(overviewData["Beta"]).toFixed(2) : "-";
            dayMovingAverage.innerText = overviewData["200DayMovingAverage"] !== "None" ? parseFloat(overviewData["200DayMovingAverage"]).toFixed(2) : "-";

            fetchedBeta = parseFloat(overviewData["Beta"]);
            fetchedSector = overviewData["Sector"];
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

        currentFetchedStockData = {
            symbol: symbol,
            name: companyName.innerText,
            price: parseFloat(stock["05. price"]),
            change: changeValue,
            changePercent: changePercent,
            changeClass: stockChange.classList.contains('positive') ? 'positive' : (stockChange.classList.contains('negative') ? 'negative' : ''),
            logo: companyLogo.src,
            beta: fetchedBeta
        };

        openPopup(); // Only open popup if all data is successfully fetched

    } catch (error) {
        console.error("Error fetching stock data:", error);
        showCustomToast('error', 'API Error', 'Error fetching stock data. Please try again later or check your network connection.', 5000);
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
    beta.innerText = "-"; dayMovingAverage.innerText = "-";
    if (companyLogo) { companyLogo.src = ""; companyLogo.alt = "Company Logo"; companyLogo.style.display = 'none'; }
}


// ------------------- Selected Investments Logic -------------------

function AddInvestment() {
   

    const newInvestment = currentFetchedStockData;

    const isDuplicate = selectedInvestments.some(investment => investment.symbol === newInvestment.symbol);
    if (isDuplicate) {
        showCustomToast('info', 'Stock Already Added', `${newInvestment.name} (${newInvestment.symbol}) is already in your comparison section.`);
        closePopup(true); // Close the popup and clear data
        return;
    }

    if (selectedInvestments.length >= MAX_SELECTED_STOCKS) {
        showCustomToast('warning', 'Selection Limit Reached', `You can only select up to ${MAX_SELECTED_STOCKS} investments. Please remove one to add another.`);
        closePopup(true); // Close the popup and clear data
        return;
    }

    // If all checks pass, add the investment
    selectedInvestments.push(newInvestment);
    renderSelectedStocks();
    updateCharts();
    closePopup(false); // Do NOT clear currentFetchedStockData here, it will be nulled below.

    showCustomToast('success', 'Stock Added!', `${newInvestment.name} (${newInvestment.symbol}) has been successfully added to your comparison section.`);

    // VERY IMPORTANT: Only clear currentFetchedStockData *after* successful addition or
    // after determining it's a duplicate/limit reached and a toast has been shown.
    currentFetchedStockData = null;
}


function removeInvestment(symbolToRemove) {
    const removedStock = selectedInvestments.find(investment => investment.symbol === symbolToRemove);
    const removedStockName = removedStock ? `${removedStock.name} (${removedStock.symbol})` : 'A stock';

    selectedInvestments = selectedInvestments.filter(investment => investment.symbol !== symbolToRemove);
    renderSelectedStocks();
    updateCharts();

    showCustomToast('info', 'Stock Removed', `${removedStockName} has been removed from your comparison list.`);
}

function renderSelectedStocks() {
    selectedStocksContainer.innerHTML = '';

    if (selectedInvestments.length === 0) {
        selectedStocksSection.classList.add('d-none');
    } else {
        selectedStocksSection.classList.remove('d-none');
    }

    selectedInvestments.forEach(investment => {
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

// ------------------- Chart Logic -------------------

function updateCharts() {
    const stockSymbols = selectedInvestments.map(inv => inv.symbol);
    const dailyReturns = selectedInvestments.map(inv => inv.changePercent);
    const betaValues = selectedInvestments.map(inv => inv.beta);

    if (selectedInvestments.length === 0) {
        chartsContainer.classList.add('d-none');
        if (riskChartInstance) {
            riskChartInstance.destroy();
            riskChartInstance = null;
        }
        if (returnChartInstance) {
            returnChartInstance.destroy();
            returnChartInstance = null;
        }
        return;
    } else {
        chartsContainer.classList.remove('d-none');
    }

    const riskCtx = document.getElementById('RiskChart').getContext('2d');
    const returnCtx = document.getElementById('ReturnChart').getContext('2d');

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
                backgroundColor: betaValues.map(beta => {
                    if (beta === null || isNaN(beta)) return 'rgba(128, 128, 128, 0.7)';
                    if (beta > 1) return 'rgba(255, 99, 132, 0.7)';
                    if (beta < 0.8) return 'rgba(75, 192, 192, 0.7)';
                    return 'rgba(255, 206, 86, 0.7)';
                }),
                borderColor: betaValues.map(beta => {
                    if (beta === null || isNaN(beta)) return 'rgba(128, 128, 128, 1)';
                    if (beta > 1) return 'rgba(255, 99, 132, 1)';
                    if (beta < 0.8) return 'rgba(75, 192, 192, 1)';
                    return 'rgba(255, 206, 86, 1)';
                }),
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
                            return `${context.dataset.label}: ${context.raw !== null && !isNaN(context.raw) ? context.raw.toFixed(2) : 'N/A'}`;
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
                backgroundColor: dailyReturns.map(ret => ret >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
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
                            return `${context.dataset.label}: ${context.raw !== null && !isNaN(context.raw) ? context.raw.toFixed(2) : 'N/A'}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
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