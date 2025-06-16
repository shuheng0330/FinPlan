const API_CONFIG = {
    fmp: {
        key: 'RipG4Z6vScFUHiukMU9oFaQ90nh2CRCi', 
        baseUrl: 'https://financialmodelingprep.com/api/v3/'
    },
    newsAPI: {
        key: 'd76cb9f3154849a9bd846f9b2779ff7e', 
        baseUrl: 'https://newsapi.org/v2/'
    }
};

const USE_DUMMY_STOCK_DATA = false; // Set to false to use real API data for stocks

const logoMap = {
    AAPL: 'trace.svg',
    NVDA: 'nvidia-svgrepo-com.svg',
    TSLA: 'tesla-svgrepo-com.svg',
};

const dummyDashboardStockData = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '212.43', change: '3.50', changePercent: '1.67' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '130.78', change: '-1.25', changePercent: '-0.95' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: '182.56', change: '5.10', changePercent: '2.87' },
];

// --- Helper Functions for Loading/Error States ---
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

// --- Data Fetching Functions ---

async function fetchDashboardStockData() {
    if (USE_DUMMY_STOCK_DATA) {
        console.log('DEBUG: Using dummy stock data for dashboard.');
        return dummyDashboardStockData;
    }

    const symbols = ['AAPL', 'NVDA', 'TSLA'];
    const stocksData = [];

    try {
        for (const symbol of symbols) {
            // Fetch only current quote data for today's price and change
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
        // Fetch only 3 recent business headlines, always from API
        const response = await fetch(
            `${API_CONFIG.newsAPI.baseUrl}top-headlines?category=business&language=en&pageSize=4&apiKey=${API_CONFIG.newsAPI.key}`
        );
        if (!response.ok) throw new Error(`Network response was not ok for news: ${response.status}`);
        const data = await response.json();
        return data.articles;
    } catch (error) {
        console.error("Error fetching dashboard news from API:", error);
        return [];
    }
}

// --- UI Update Functions ---

function updateDashboardStockCards(stocks) {
    const container = document.getElementById('dashboard-stock-insights');
    if (!container) return;

    container.innerHTML = ''; // Clear existing content
    hideLoading('dashboard-indices');

    if (stocks.length === 0) {
        showError('dashboard-indices');
        return;
    }

    stocks.forEach(stock => {
        const isPositive = parseFloat(stock.change) >= 0;
        const backgroundColor = isPositive ? '#d4edda' : '#f8d7da'; // Light green or light red
        const textColor = isPositive ? '#155724' : '#721c24'; // Dark green or dark red

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

    newsList.innerHTML = ''; // Clear existing content
    hideLoading('dashboard-news');

    if (articles.length === 0) {
        showError('dashboard-news');
        return;
    }

    const orderedList = document.createElement('ol');
    orderedList.className = 'ms-4 mb-1';
    articles.slice(0, 3).forEach(article => { // Limit to 3 news items for dashboard
        const listItem = document.createElement('li');
        listItem.className = 'mb-2 regularText';
        listItem.innerHTML = `<a href="${article.url}" target="_blank" class="text-decoration-none text-dark">${article.title}</a>`;
        orderedList.appendChild(listItem);
    });
    newsList.appendChild(orderedList);
}

// --- Dashboard Initialization ---
async function initDashboard() {
    showLoading('dashboard-indices');
    showLoading('dashboard-news');

    // Fetch and update stock cards
    try {
        const stocks = await fetchDashboardStockData();
        updateDashboardStockCards(stocks);
    } catch (error) {
        console.error("Error initializing dashboard stocks:", error);
        showError('dashboard-indices');
    }

    // Fetch and update news list
    try {
        const news = await fetchDashboardNews();
        updateDashboardNewsList(news);
    } catch (error) {
        console.error("Error initializing dashboard news:", error);
        showError('dashboard-news');
    }
}

// Event Listener: Run when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the dashboard page.
    // Assuming dashboard.ejs is served at the root '/' or '/dashboard'
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        initDashboard();
    }
});