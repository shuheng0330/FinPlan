// market.js
// API Configuration
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

// Logo Mapping
const logoMap = {
  AAPL: 'trace.svg',
  NVDA: 'nvidia-svgrepo-com.svg',
  TSLA: 'tesla-svgrepo-com.svg',
  AMZN: 'trace (1).svg',
  GOOGL: 'google-icon-logo-svgrepo-com.svg',
  WMT: 'walmart.svg',
  MSFT: 'microsoft.svg',
  META: 'meta.svg',     
  JPM: 'jpmorgan.svg', 
  KO: 'cocacola.svg'  
};

// List of accessible stocks for "Add Stock"
const accessibleStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'META', name: 'Meta Platforms, Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'KO', name: 'The Coca-Cola Company' }
];

// Cache System
const cache = {
  indices: null,
  stocks: null,
  news: null,
  ratings: null,
  earnings: null,
  lastUpdated: null
};

// Dynamic watchlist (initial stocks)
let watchlist = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL'];

// Main Data Fetching Functions

async function fetchIndexData(timeRange = '30d') {
  try {
    showLoading('indices');
    if (cache.indices && Date.now() - cache.lastUpdated < 300000) {
      return cache.indices;
    }
    const symbols = ['AAPL', 'NVDA', 'TSLA'];
    const response = await fetch(
      `${API_CONFIG.fmp.baseUrl}quote/${symbols.join(',')}?apikey=${API_CONFIG.fmp.key}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const formattedData = data.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price.toFixed(2),
      change: stock.change.toFixed(2),
      changePercent: stock.changesPercentage.toFixed(2)
    }));
    cache.indices = formattedData;
    cache.lastUpdated = Date.now();
    hideLoading('indices');
    return formattedData;
  } catch (error) {
    console.error('Error fetching index data:', error);
    showError('indices');
    return [];
  }
}

async function fetchStockData(symbols = watchlist, timeRange = '30d') {
  try {
    showLoading('stocks');
    if (cache.stocks && Date.now() - cache.lastUpdated < 300000) {
      return cache.stocks;
    }
    const response = await fetch(
      `${API_CONFIG.fmp.baseUrl}quote/${symbols.join(',')}?apikey=${API_CONFIG.fmp.key}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
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
    cache.stocks = formattedData;
    cache.lastUpdated = Date.now();
    hideLoading('stocks');
    return formattedData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    showError('stocks');
    return [];
  }
}

async function fetchMarketNews() {
  try {
    showLoading('news');
    if (cache.news && Date.now() - cache.lastUpdated < 300000) {
      return cache.news;
    }
    const response = await fetch(
      `${API_CONFIG.newsAPI.baseUrl}top-headlines?category=business&language=en&pageSize=5&apiKey=${API_CONFIG.newsAPI.key}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.news = data.articles;
    cache.lastUpdated = Date.now();
    hideLoading('news');
    return data.articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    showError('news');
    return [];
  }
}

async function fetchAnalystRatings(symbols = ['AAPL', 'NVDA', 'TSLA']) {
  try {
    showLoading('ratings');
    if (cache.ratings && Date.now() - cache.lastUpdated < 300000) {
      return cache.ratings;
    }
    const ratings = [];
    for (const symbol of symbols) {
      const response = await fetch(
        `${API_CONFIG.fmp.baseUrl}rating/${symbol}?apikey=${API_CONFIG.fmp.key}`
      );
      if (!response.ok) throw new Error(`Failed to fetch rating for ${symbol}`);
      const data = await response.json();
      if (data.length > 0) {
        ratings.push({
          symbol: symbol,
          name: data[0].companyName,
          rating: data[0].rating || 'Hold',
          ratingScore: data[0].ratingScore || 3,
          recommendation: data[0].ratingRecommendation || 'Neutral'
        });
      }
    }
    cache.ratings = ratings;
    cache.lastUpdated = Date.now();
    hideLoading('ratings');
    return ratings;
  } catch (error) {
    console.error('Error fetching analyst ratings:', error);
    showError('ratings');
    return [];
  }
}


//   try {
//     showLoading('earnings');
//     if (cache.earnings && Date.now() - cache.lastUpdated < 300000) {
//       return cache.earnings;
//     }
//     const response = await fetch(
//       `${API_CONFIG.fmp.baseUrl}calendar/earnings?from=${new Date().toISOString().split('T')[0]}&to=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&apikey=${API_CONFIG.fmp.key}`
//     );
//     if (!response.ok) throw new Error('Network response was not ok');
//     const data = await response.json();
//     const filteredData = data.filter(event => symbols.includes(event.symbol)).map(event => ({
//       symbol: event.symbol,
//       name: event.companyName || event.symbol,
//       date: event.date
//     }));
//     cache.earnings = filteredData;
//     cache.lastUpdated = Date.now();
//     hideLoading('earnings');
//     return filteredData;
//   } catch (error) {
//     console.error('Error fetching earnings data:', error);
//     showError('earnings');
//     return [];
//   }
// }

// Helper Functions

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
  hideLoading(type);
}

// UI Update Functions

function updateIndexSection(indices) {
  const container = document.getElementById('indices-container');
  if (!container) return;
  const symbols = ['aapl', 'nvda', 'tsla'];
  indices.forEach((index, i) => {
    const priceElement = document.getElementById(`${symbols[i]}-price`);
    const changeElement = document.getElementById(`${symbols[i]}-change`);
    if (priceElement && changeElement) {
      priceElement.textContent = `$${index.price}`;
      changeElement.textContent = `${index.change} (${index.changePercent}%)`;
      changeElement.className = index.change >= 0 ? 'positive-change small' : 'negative-change small';
    }
  });
}

function updateStockTable(stocks) {
  const tableBody = document.querySelector('#stock-table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  stocks.forEach(stock => {
    const changeClass = stock.change >= 0 ? 'positive-change' : 'negative-change';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="fw-bold">${stock.symbol}</td>
      <td>
        <div class="d-flex align-items-center">
          <img src="/svgs/${logoMap[stock.symbol] || stock.symbol.toLowerCase() + '.svg'}" 
               class="stock-logo" 
               onerror="this.src='/svgs/default-stock.svg'">
          ${stock.name}
        </div>
      </td>
      <td class="fw-bold">$${stock.price}</td>
      <td class="${changeClass}">${stock.change}</td>
      <td class="${changeClass}">${stock.changePercent}%</td>
      <td>$${stock.marketCap}</td>
      <td>${stock.volume}</td>
      <td>$${stock.yearHigh}</td>
      <td>$${stock.yearLow}</td>

    `;
    tableBody.appendChild(row);
  });
}

      // <td>
      //   <button class="btn btn-sm btn-outline-primary">View</button>
      // </td>

function updateNewsSection(articles) {
  const newsContainer = document.querySelector('#news-container');
  if (!newsContainer) return;
  newsContainer.innerHTML = '';
  if (articles.length > 0) {
    const featured = articles[0];
    newsContainer.innerHTML += `
      <div class="col-md-12 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <img src="${featured.urlToImage || '/images/default-news.jpg'}" 
               class="card-img-top" alt="${featured.title}" 
               onerror="this.src='/images/default-news.jpg'">
          <div class="card-body">
            <span class="badge bg-primary mb-2">Featured</span>
            <h5 class="card-title">${featured.title}</h5>
            <p class="card-text">${featured.description || 'No description available.'}</p>
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">${new Date(featured.publishedAt).toLocaleString()} • ${featured.source?.name || 'Unknown'}</small>
              <a href="${featured.url}" target="_blank" class="btn btn-sm btn-outline-primary">Read More</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  articles.slice(1).forEach(article => {
    newsContainer.innerHTML += `
      <div class="col-md-6 mb-3">
        <div class="card border-0 bg-white shadow-sm h-100">
          <div class="card-body">
            <h6 class="card-title">${article.title}</h6>
            <p class="card-text small">${article.description || 'No description available.'}</p>
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

function updateAnalystRatings(ratings) {
  const container = document.getElementById('analyst-ratings');
  if (!container) return;
  container.innerHTML = '';
  ratings.forEach(rating => {
    const score = rating.ratingScore || 3;
    const buy = score >= 4 ? 60 : score === 3 ? 30 : 10;
    const hold = score >= 4 ? 25 : score === 3 ? 40 : 30;
    const sell = score >= 4 ? 10 : score === 3 ? 20 : 40;
    const strongSell = score >= 4 ? 5 : score === 3 ? 10 : 20;
    const total = buy + hold + sell + strongSell;
    container.innerHTML += `
      <div class="card bg-white shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center">
              <img src="/svgs/${logoMap[rating.symbol] || rating.symbol.toLowerCase() + '.svg'}" 
                   class="me-2" style="width: 30px; height: 30px;" 
                   onerror="this.src='/svgs/default-stock.svg'">
              <div>
                <p class="mb-0 fw-bold">${rating.symbol}</p>
                <p class="mb-0 small text-muted">${rating.name}</p>
              </div>
            </div>
            <span class="badge bg-${rating.rating === 'Buy' || rating.rating === 'Strong Buy' ? 'success' : rating.rating === 'Hold' ? 'warning' : 'danger'}">${rating.rating}</span>
          </div>
          <div class="progress mb-2" style="height: 6px;">
            <div class="progress-bar bg-success" style="width: ${(buy / total) * 100}%"></div>
            <div class="progress-bar bg-info" style="width: ${(hold / total) * 100}%"></div>
            <div class="progress-bar bg-warning" style="width: ${(sell / total) * 100}%"></div>
            <div class="progress-bar bg-danger" style="width: ${(strongSell / total) * 100}%"></div>
          </div>
          <div class="d-flex justify-content-between small">
            <span>${buy}% Buy</span>
            <span>${hold}% Hold</span>
            <span>${sell}% Sell</span>
            <span>${strongSell}% Strong Sell</span>
          </div>
        </div>
      </div>
    `;
  });
}


// Initialization

async function initDashboard(timeRange = '30d') {
  const indices = await fetchIndexData(timeRange);
  updateIndexSection(indices);
  const stocks = await fetchStockData(watchlist, timeRange);
  updateStockTable(stocks);
  const news = await fetchMarketNews();
  updateNewsSection(news);
  const ratings = await fetchAnalystRatings(['AAPL', 'NVDA', 'TSLA']);
  updateAnalystRatings(ratings);
  const earnings = await fetchEarningsCalendar(['AMZN', 'WMT', 'GOOGL']);
  updateEarningsCalendar(earnings);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  document.querySelectorAll('#timeRangeDropdown + .dropdown-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const timeRange = e.target.getAttribute('data-range');
      document.getElementById('timeRangeDropdown').textContent = e.target.textContent;
      initDashboard(timeRange);
    });
  });

  // Add Stock button functionality with dropdown
  document.getElementById('add-stock-btn')?.addEventListener('click', () => {
    // Check if dropdown already exists
    if (document.getElementById('add-stock-dropdown')) return;

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.id = 'add-stock-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1000';
    dropdown.className = 'dropdown-menu show';
    accessibleStocks.forEach(stock => {
      const option = document.createElement('a');
      option.className = 'dropdown-item';
      option.href = '#';
      option.textContent = `${stock.symbol} - ${stock.name}`;
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const symbol = stock.symbol;
        fetch('/market/add-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ symbol })
        })
          .then(response => response.json())
          .then(data => {
            alert(data.message || 'Stock added!');
            // Add to watchlist if not already present
            if (!watchlist.includes(symbol)) {
              watchlist.push(symbol);
            }
            // Refresh the stock table
            fetchStockData(watchlist).then(stocks => updateStockTable(stocks));
            // Remove dropdown
            dropdown.remove();
          })
          .catch(error => {
            console.error('Error adding stock:', error);
            alert('Failed to add stock.');
            dropdown.remove();
          });
      });
      dropdown.appendChild(option);
    });

    // Position dropdown below the button
    const button = document.getElementById('add-stock-btn');
    button.insertAdjacentElement('afterend', dropdown);
    

    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target) && e.target !== button) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
        
      }
    });
  });
});