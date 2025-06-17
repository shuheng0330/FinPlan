// public/js/dashboard.js (This file now contains all logic for the dashboard page)

// --- API Configurations (Shared) ---
const API_CONFIG = {
    fmp: {
        key: 'hqdrP0yscAebCSnc8lDxgDvautN5olD7',
        baseUrl: 'https://financialmodelingprep.com/api/v3/'
    },
    newsAPI: {
        key: 'd76cb9f3154849a9bd846f9b2779ff7e',
        baseUrl: 'https://newsapi.org/v2/'
    }
};

const ALPHA_VANTAGE_API_KEY = '24WFSJXQ4N24BBBR'; // Your Alpha Vantage API Key for MSFT data

const USE_DUMMY_STOCK_DATA = false; // Set to false to use real API data for FMP stocks
const USE_DUMMY_MSFT_DATA = false; // <--- Set this to FALSE to use FMP data for MSFT


// --- Combined Logo Map ---
const logoMap = {
    AAPL: 'trace.svg',
    NVDA: 'nvidia-svgrepo-com.svg',
    TSLA: 'tesla-svgrepo-com.svg',
    MSFT: 'Xiang/msft.png', 
};

const dummyDashboardStockData = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '212.43', change: '3.50', changePercent: '1.67' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '130.78', change: '-1.25', changePercent: '-0.95' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: '182.56', change: '5.10', changePercent: '2.87' },
];

// --- Helper Functions for Loading/Error States (Shared) ---
function showLoading(type) {
    const loader = document.getElementById(`loading-${type}`);
    const error = document.getElementById(`error-${type}`);
    if (loader) loader.classList.remove('d-none');
    if (error) error.classList.add('d-none');
}

function hideLoading(type) {
    const loader = document.getElementById(`loading-${type}`);
    const error = document.getElementById(`error-${type}`);
    if (loader) loader.classList.add('d-none');
    if (error) error.classList.add('d-none');
}

function showError(type) {
    const loader = document.getElementById(`loading-${type}`);
    const error = document.getElementById(`error-${type}`);
    if (loader) loader.classList.add('d-none');
    if (error) error.classList.remove('d-none');
}

// --- Helper function to format currency (Used by MSFT ROI) ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR', // Assuming RM is Malaysian Ringgit
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};


// --- Data Fetching Functions (Teammate's Part: FMP Stocks & NewsAPI News) ---
async function fetchDashboardStockData() {
    if (USE_DUMMY_STOCK_DATA) {
        console.log('DEBUG: Using dummy stock data for dashboard.');
        return dummyDashboardStockData;
    }

    const symbols = ['AAPL', 'NVDA', 'TSLA'];
    const stocksData = [];

    try {
        for (const symbol of symbols) {
            const quoteUrl = `${API_CONFIG.fmp.baseUrl}quote/${symbol}?apikey=${API_CONFIG.fmp.key}`;
            const response = await fetch(quoteUrl);
            if (!response.ok) throw new Error(`Failed to fetch current data for ${symbol}: ${response.status}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const stock = data[0];
                stocksData.push({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.price ? stock.price.toFixed(2) : 'N/A',
                    change: stock.change ? stock.change.toFixed(2) : 'N/A',
                    changePercent: stock.changesPercentage ? stock.changesPercentage.toFixed(2) : 'N/A'
                });
            } else {
                console.warn(`No current quote data found for ${symbol}`);
            }
        }
        return stocksData;
    } catch (error) {
        console.error("Error fetching dashboard stock data from API:", error);
        return [];
    }
}

async function fetchDashboardNews() {
    try {
        const response = await fetch(
            `${API_CONFIG.newsAPI.baseUrl}top-headlines?category=business&language=en&pageSize=4&apiKey=${API_CONFIG.newsAPI.key}`
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`NewsAPI error: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data.articles;
    } catch (error) {
        console.error("Error fetching dashboard news from API:", error);
        return [];
    }
}

// --- UI Update Functions (Teammate's Part) ---
function updateDashboardStockCards(stocks) {
    const container = document.getElementById('dashboard-stock-insights');
    if (!container) return;

    container.innerHTML = '';
    hideLoading('dashboard-indices');

    if (stocks.length === 0) {
        showError('dashboard-indices');
        return;
    }

    stocks.forEach(stock => {
        const isPositive = parseFloat(stock.change) >= 0;
        const backgroundColor = isPositive ? '#d4edda' : '#f8d7da';
        const textColor = isPositive ? '#155724' : '#721c24';

        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="p-3 bg-white rounded shadow-sm h-100 d-flex flex-column justify-content-between">
                <div class="d-flex align-items-center mb-2">
                    <img src="/svgs/${logoMap[stock.symbol] || 'default-stock.svg'}"
                         alt="${stock.name} logo" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;"
                         onerror="this.src='/svgs/default-stock.svg'">
                    <span class="fw-semibold">${stock.name}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <p class="mb-0 fw-bold">$${stock.price}</p>
                    <span class="badge rounded-pill p-2" style="background-color: ${backgroundColor}; color: ${textColor};">
                        ${stock.changePercent}%
                    </span>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function updateDashboardNewsList(articles) {
    const newsList = document.getElementById('dashboard-news-list');
    if (!newsList) return;

    newsList.innerHTML = '';
    hideLoading('dashboard-news');

    if (articles.length === 0) {
        showError('dashboard-news');
        return;
    }

    const orderedList = document.createElement('ol');
    orderedList.className = 'ms-4 mb-1';
    articles.slice(0, 3).forEach(article => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-2 regularText';
        listItem.innerHTML = `<a href="${article.url}" target="_blank" class="text-decoration-none text-dark">${article.title}</a>`;
        orderedList.appendChild(listItem);
    });
    newsList.appendChild(orderedList);
}

// --- Dashboard Initialization (Teammate's Part) ---
async function initDashboard() {
    showLoading('dashboard-indices');
    showLoading('dashboard-news');

    try {
        const stocks = await fetchDashboardStockData();
        updateDashboardStockCards(stocks);
    } catch (error) {
        console.error("Error initializing dashboard stocks (teammate's part):", error);
        showError('dashboard-indices');
    }

    try {
        const news = await fetchDashboardNews();
        updateDashboardNewsList(news);
    } catch (error) {
        console.error("Error initializing dashboard news (teammate's part):", error);
        showError('dashboard-news');
    }
}

// --- Fetch and Display Example ROI (Your Part: Microsoft MSFT - NOW USING FMP) ---
const fetchMsftRoi = async () => {
    console.log('DEBUG: fetchMsftRoi function called (using FMP).');

    const exampleStockSymbolElement = document.getElementById('example-stock-symbol');
    const exampleRoiPercentageElement = document.getElementById('example-roi-percentage');
    const msftCardContainer = document.getElementById('msft-card-container');
    const msftLoadingMessage = document.getElementById('msft-loading-message');

    if (msftLoadingMessage) msftLoadingMessage.classList.remove('d-none');
    if (msftCardContainer) msftCardContainer.innerHTML = '';

    const FMP_API_KEY = API_CONFIG.fmp.key;
    const FMP_BASE_URL = API_CONFIG.fmp.baseUrl;
    const MSFT_SYMBOL = 'MSFT';

    if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_FMP_API_KEY') { // Use your actual FMP key check
        console.error('FMP API Key is not set or is a placeholder for MSFT data. Skipping fetch.');
        if (exampleStockSymbolElement) exampleStockSymbolElement.textContent = 'API Key Missing';
        if (exampleRoiPercentageElement) exampleRoiPercentageElement.textContent = 'N/A';
        if (msftLoadingMessage) {
            msftLoadingMessage.textContent = 'FMP API Key required for MSFT data.';
            msftLoadingMessage.classList.remove('d-none');
        }
        return;
    }

    try {
        console.log(`DEBUG: Attempting to fetch FMP historical data for ${MSFT_SYMBOL}...`);
        const fmpResponse = await fetch(`${FMP_BASE_URL}historical-price-full/${MSFT_SYMBOL}?apikey=${FMP_API_KEY}`);
        const fmpData = await fmpResponse.json();
        console.log('DEBUG: FMP response received.', fmpData);

        if (!fmpData || !fmpData.historical || fmpData.historical.length === 0) {
            throw new Error(`No historical data found for ${MSFT_SYMBOL} from FMP.`);
        }

        const historicalData = fmpData.historical;
        // FMP historical data is usually sorted by date DESC, so latest is first
        const latestClose = parseFloat(historicalData[0].adjClose);

        const oneYearAgoTimestamp = new Date();
        oneYearAgoTimestamp.setFullYear(oneYearAgoTimestamp.getFullYear() - 1);

        let priceOneYearAgo = null;
        let closestDate = null;
        let minDiff = Infinity;

        // Iterate through historical data to find the closest date to one year ago
        for (const entry of historicalData) {
            const entryDate = new Date(entry.date);
            const diff = Math.abs(oneYearAgoTimestamp - entryDate);

            if (diff < minDiff) {
                minDiff = diff;
                closestDate = entry.date;
                priceOneYearAgo = parseFloat(entry.adjClose);
            }
        }

        if (priceOneYearAgo && latestClose) {
            const roiPercentage = ((latestClose - priceOneYearAgo) / priceOneYearAgo) * 100;

            if (exampleStockSymbolElement) exampleStockSymbolElement.textContent = `${fmpData.symbol || 'Microsoft Corp.'} (${MSFT_SYMBOL})`;
            if (exampleRoiPercentageElement) {
                exampleRoiPercentageElement.textContent = `${roiPercentage.toFixed(2)}%`;
                exampleRoiPercentageElement.classList.remove('text-success', 'text-danger');
                if (roiPercentage >= 0) {
                    exampleRoiPercentageElement.classList.add('text-success');
                } else {
                    exampleRoiPercentageElement.classList.add('text-danger');
                }
            }

            if (msftLoadingMessage) msftLoadingMessage.classList.add('d-none');

            const priceDiff = latestClose - priceOneYearAgo;
            const priceChangeClass = priceDiff >= 0 ? 'text-success' : 'text-danger';
            const priceChangeArrow = priceDiff >= 0 ? '↑' : '↓';

            msftCardContainer.innerHTML = `
                <div class="col-md-12">
                    <div class="p-3 bg-white rounded shadow-sm h-100">
                        <div class="d-flex align-items-center mb-2">
                            <img src="/svgs/${logoMap.MSFT || 'default-stock.svg'}"
                                 alt="Microsoft logo" class="me-2" style="width: 35px; height: 35px; object-fit: contain;"
                                 onerror="this.src='/svgs/default-stock.svg'">
                            <span class="fw-semibold">${fmpData.symbol || 'Microsoft Corp.'} (${MSFT_SYMBOL})</span>
                        </div>
                        <p class="mb-1 mt-3 d-flex justify-content-between">
                            <span class="regularText">Current Price:</span>
                            <span class="fw-bold">${formatCurrency(latestClose)}</span>
                        </p>
                        <p class="mb-1 d-flex justify-content-between">
                            <span class="regularText">Price 1 Year Ago (${new Date(closestDate).toLocaleDateString()}):</span>
                            <span class="fw-bold">${formatCurrency(priceOneYearAgo)}</span>
                        </p>
                        <p class="mb-0 d-flex justify-content-between">
                            <span class="regularText">Change (1 Year):</span>
                            <span class="${priceChangeClass} fw-semibold">${priceChangeArrow} ${formatCurrency(Math.abs(priceDiff))} (${roiPercentage.toFixed(2)}%)</span>
                        </p>
                    </div>
                </div>
            `;
            console.log('DEBUG: MSFT data displayed successfully using FMP data.');
        } else {
            if (exampleStockSymbolElement) exampleStockSymbolElement.textContent = 'Data N/A';
            if (exampleRoiPercentageElement) exampleRoiPercentageElement.textContent = 'N/A';
            if (msftLoadingMessage) {
                msftLoadingMessage.textContent = 'Could not calculate ROI for MSFT due to insufficient data from FMP.';
                msftLoadingMessage.classList.remove('d-none');
            }
            console.log('DEBUG: Insufficient data for MSFT ROI calculation from FMP.');
        }

    } catch (error) {
        console.error('ERROR: Failed to load MSFT data from FMP:', error);
        if (exampleStockSymbolElement) exampleStockSymbolElement.textContent = 'Error';
        if (exampleRoiPercentageElement) exampleRoiPercentageElement.textContent = 'N/A';
        if (msftLoadingMessage) {
            msftLoadingMessage.textContent = 'Failed to load MSFT data from FMP: ' + error.message;
            msftLoadingMessage.classList.remove('d-none');
        }
    }
};

// --- Single DOMContentLoaded Event Listener for the Entire Dashboard ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: Combined dashboard.js loaded and DOM fully parsed.');
    console.log('DEBUG: Current Pathname:', window.location.pathname);

    // Run both initialization functions if on the dashboard page
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        console.log('DEBUG: Pathname matched. Initializing all dashboard components.');
        initDashboard(); // Teammate's stock and news data
        fetchMsftRoi();  // Your MSFT ROI data
    } else {
        console.log('DEBUG: Not on dashboard page. Skipping data fetches for dashboard components.');
    }
});