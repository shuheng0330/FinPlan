// ====================
// API Configuration
// ====================
const API_CONFIG = {
  alphaVantage: {
    key: 'Y5OVC3O4V3DELAY5',
    baseUrl: 'https://www.alphavantage.co/query?'
  },
  fmp: {
    key: 'hqdrP0yscAebCSnc8lDxgDvautN5olD7',
    baseUrl: 'https://financialmodelingprep.com/api/v3/'
  },
  newsAPI: {
    key: 'd76cb9f3154849a9bd846f9b2779ff7e',
    baseUrl: 'https://newsapi.org/v2/'
  }
};

// ====================
// Cache System
// ====================
const cache = {
  stocks: null,
  news: null,
  lastUpdated: null
};

// ====================
// Main Data Fetching Functions
// ====================

/**
 * Fetches stock data from Financial Modeling Prep API
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise<Array>} - Array of formatted stock data
 */
async function fetchStockData(symbols = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL']) {
  try {
    showLoading('stocks');
    
    // Check cache first (5 minute cache)
    if (cache.stocks && Date.now() - cache.lastUpdated < 300000) {
      return cache.stocks;
    }

    const response = await fetch(
      `${API_CONFIG.fmp.baseUrl}quote/${symbols.join(',')}?apikey=${API_CONFIG.fmp.key}`
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // Format data consistently
    const formattedData = data.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price.toFixed(2),
      change: stock.change.toFixed(2),
      changePercent: stock.changesPercentage.toFixed(2),
      marketCap: (stock.marketCap / 1000000000).toFixed(2) + 'B',
      volume: (stock.volume / 1000000).toFixed(1) + 'M',
      yearHigh: stock.yearHigh.toFixed(2),
      yearLow: stock.yearLow.toFixed(2)
    }));
    
    // Update cache
    cache.stocks = formattedData;
    cache.lastUpdated = Date.now();
    
    hideLoading('stocks');
    return formattedData;
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    showError('stocks');
    return getDummyStockData(); // Fallback to dummy data
  }
}

/**
 * Fetches market news from NewsAPI
 * @returns {Promise<Array>} - Array of news articles
 */
async function fetchMarketNews() {
  try {
    showLoading('news');
    
    const response = await fetch(
      `${API_CONFIG.newsAPI.baseUrl}top-headlines?category=business&language=en&pageSize=5&apiKey=${API_CONFIG.newsAPI.key}`
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    hideLoading('news');
    return data.articles;
    
  } catch (error) {
    console.error('Error fetching news:', error);
    showError('news');
    return getDummyNewsData(); // Fallback to dummy data
  }
}

// ====================
// Helper Functions
// ====================

function showLoading(type) {
  const loader = document.getElementById(`loading-${type}`);
  const error = document.getElementById(`error-${type}`);
  if (loader) loader.classList.remove('d-none');
  if (error) error.classList.add('d-none');
}

function hideLoading(type) {
  const element = document.getElementById(`loading-${type}`);
  if (element) element.classList.add('d-none');
}

function showError(type) {
  const element = document.getElementById(`error-${type}`);
  if (element) element.classList.remove('d-none');
}

// ====================
// Dummy Data (Fallback)
// ====================

function getDummyStockData() {
  return [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: '189.37',
      change: '+2.34',
      changePercent: '+1.25',
      marketCap: '2.95B',
      volume: '45.6M',
      yearHigh: '198.23',
      yearLow: '124.17'
    },
    // ... other dummy stocks
  ];
}

function getDummyNewsData() {
  return [
    {
      title: 'Tech Stocks Rally as AI Boom Continues',
      description: 'The technology sector led gains on Wall Street today...',
      urlToImage: '../../images/default-news.jpg',
      publishedAt: new Date().toISOString(),
      source: { name: 'Bloomberg' },
      url: '#'
    },
    // ... other dummy news
  ];
}

// ====================
// UI Update Functions
// ====================

function updateStockTable(stocks) {
  const tableBody = document.querySelector('#stock-table tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  stocks.forEach(stock => {
    const changeClass = stock.change >= 0 ? 'text-success' : 'text-danger';
    const changePercentClass = stock.changePercent >= 0 ? 'text-success' : 'text-danger';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="fw-bold">${stock.symbol}</td>
      <td>
        <div class="d-flex align-items-center">
          <img src="../../svgs/${stock.symbol.toLowerCase()}-svgrepo-com.svg" 
               class="me-2" style="width:24px;height:24px;" 
               onerror="this.src='../../svgs/default-stock.svg'">
          ${stock.name}
        </div>
      </td>
      <td class="fw-bold">$${stock.price}</td>
      <td class="${changeClass}">${stock.change}</td>
      <td class="${changePercentClass}">${stock.changePercent}%</td>
      <td>$${stock.marketCap}</td>
      <td>${stock.volume}</td>
      <td>$${stock.yearHigh}</td>
      <td>$${stock.yearLow}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary">View</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function updateNewsSection(articles) {
  const newsContainer = document.querySelector('#news-container');
  if (!newsContainer) return;
  
  newsContainer.innerHTML = '';
  
  if (articles.length > 0) {
    const featured = articles[0];
    newsContainer.innerHTML += `
      <div class="col-md-12 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <img src="${featured.urlToImage || '../../images/default-news.jpg'}" 
               class="card-img-top" alt="${featured.title}" 
               style="height: 200px; object-fit: cover;"
               onerror="this.src='../../images/default-news.jpg'">
          <div class="card-body">
            <span class="badge bg-primary mb-2">Featured</span>
            <h5 class="card-title">${featured.title}</h5>
            <p class="card-text regularText">${featured.description || 'No description available.'}</p>
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">${new Date(featured.publishedAt).toLocaleString()} • ${featured.source?.name || 'Unknown'}</small>
              <a href="${featured.url}" target="_blank" class="btn btn-sm btn-outline-primary">Read More</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Other articles
  articles.slice(1).forEach(article => {
    newsContainer.innerHTML += `
      <div class="col-md-6 mb-3">
        <div class="card border-0 bg-white shadow-sm h-100">
          <div class="card-body">
            <h6 class="card-title">${article.title}</h6>
            <p class="card-text small regularText">${article.description || 'No description available.'}</p>
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">${new Date(article.publishedAt).toLocaleDateString()} • ${article.source?.name || 'Unknown'}</small>
              <a href="${article.url}" target="_blank" class="btn btn-sm btn-outline-secondary">Read</a>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

// ====================
// Initialization
// ====================

async function initDashboard() {
  const stocks = await fetchStockData();
  updateStockTable(stocks);
  
  const news = await fetchMarketNews();
  updateNewsSection(news);
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);