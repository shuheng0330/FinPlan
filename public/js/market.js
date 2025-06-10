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

function getDatesForTimeRange(timeRange) {
    const today = new Date();
    let startDate = new Date();

    switch (timeRange) {
        case '1d': // Today 
              startDate.setDate(today.getDate());
            break;
        case '7d': // Last 7 days
            startDate.setDate(today.getDate() - 7);
            break;
        case '30d': // Last 30 days
        case '1m': // Last month (often equivalent to 30d for simplicity)
            startDate.setDate(today.getDate() - 30);
            break;
        case '3m': // Last 3 months
            startDate.setMonth(today.getMonth() - 3);
            break;
        case '6m': // Last 6 months
            startDate.setMonth(today.getMonth() - 6);
            break;
        case '1y': // Last 1 year
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case '3y': // Last 3 years
            startDate.setFullYear(today.getFullYear() - 3);
            break;
        case '5y': // Last 5 years
            startDate.setFullYear(today.getFullYear() - 5);
            break;
        case 'ytd': // Year to date
            startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
            break;
        default: // Default to 30 days if unrecognized
            startDate.setDate(today.getDate() - 30);
            break;
    }

    // Ensure startDate is not in the future and handles edge cases for month/year calculations
    if (startDate > today) {
        startDate = today;
    }

    const formatDate = (date) => date.toISOString().split('T')[0];

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(today) // End date is always today
    };
}

// Main Data Fetching Functions
async function fetchIndexData(timeRange = '30d') {
    try {
        console.log(`DEBUG: fetchIndexData started for timeRange: ${timeRange}`);
        showLoading('indices');

        // IMPORTANT: For dynamic range, cache needs to be specific to (symbol, timeRange) pair,
        // or disabled for this demo, as 'cache.indices' alone isn't enough.
        // For now, assume caching is off or you've handled invalidation per API call.
        // You might want to remove or comment out these cache checks for testing:
        // if (cache.indices && Date.now() - cache.lastUpdated < 300000) {
        //   console.log('DEBUG: fetchIndexData returning from cache');
        //   return cache.indices;
        // }

        const symbols = ['AAPL', 'NVDA', 'TSLA']; // These are your fixed index symbols
        const indicesData = [];
        const { startDate, endDate } = getDatesForTimeRange(timeRange);

        for (const symbol of symbols) {
            let currentPrice = null;
            let startPeriodPrice = null;
            let companyName = symbol; // Default, will try to get full name from quote
            let marketCap = 'N/A';
            let volume = 'N/A';
            let yearHigh = 'N/A';
            let yearLow = 'N/A';
            let currentQuoteData = null; // To store the full quote object if fetched successfully

            // --- 1. Fetch current quote data (for latest price, name, marketCap, volume) ---
            try {
                const quoteUrl = `${API_CONFIG.fmp.baseUrl}quote/${symbol}?apikey=${API_CONFIG.fmp.key}`;
                console.log(`DEBUG: Fetching current quote for ${symbol} from: ${quoteUrl}`);
                const quoteResponse = await fetch(quoteUrl);
                if (!quoteResponse.ok) throw new Error(`Quote network response not ok for ${symbol}: ${quoteResponse.status}`);
                const quoteJson = await quoteResponse.json();

                if (quoteJson && quoteJson.length > 0) {
                    currentQuoteData = quoteJson[0]; // Store the full quote object
                    currentPrice = currentQuoteData.price;
                    companyName = currentQuoteData.name || symbol;
                    marketCap = (currentQuoteData.marketCap / 1_000_000_000_000).toFixed(3) + 'B'; // Format to trillions
                    volume = (currentQuoteData.volume / 1_000_000).toFixed(1) + 'M'; // Format to millions
                    yearHigh = currentQuoteData.yearHigh.toFixed(2);
                    yearLow = currentQuoteData.yearLow.toFixed(2);
                } else {
                    console.warn(`DEBUG: No current quote data found for ${symbol}.`);
                }
            } catch (quoteError) {
                console.error(`DEBUG: Error fetching current quote for ${symbol}:`, quoteError);
                // Continue to historical fetch even if current quote fails, as it's optional for historical change
            }

            // --- 2. Fetch historical data for the period ---
            try {
                // For '1d' range, if we have current quote data, we can use its daily change
                if (timeRange === '1d' && currentQuoteData !== null) {
                    // Approximate start of day price using current price and daily change from quote
                    startPeriodPrice = currentPrice - (currentQuoteData.change || 0);
                    if (startPeriodPrice === 0) startPeriodPrice = currentPrice; // Avoid division by zero
                } else {
                    const historyUrl = `${API_CONFIG.fmp.baseUrl}historical-price-full/${symbol}?from=${startDate}&to=${endDate}&apikey=${API_CONFIG.fmp.key}`;
                    console.log(`DEBUG: Fetching historical data for ${symbol} from: ${historyUrl}`);
                    const historyResponse = await fetch(historyUrl);
                    if (!historyResponse.ok) throw new Error(`Historical network response not ok for ${symbol}: ${historyResponse.status}`);
                    const historyJson = await historyResponse.json();

                    if (historyJson && historyJson.historical && historyJson.historical.length > 0) {
                        // FMP historical-price-full returns data in reverse chronological order (most recent first)
                        // So, historical[0] is the latest, and historical[length-1] is the oldest within the range.
                        const oldestEntryInPeriod = historyJson.historical[historyJson.historical.length - 1];
                        startPeriodPrice = oldestEntryInPeriod.close;

                        // If currentPrice wasn't fetched from quote, use the latest historical close
                        if (currentPrice === null) {
                            currentPrice = historyJson.historical[0].close;
                        }
                    } else {
                        console.warn(`DEBUG: No historical data found for ${symbol} for range ${startDate} to ${endDate}.`);
                    }
                }
            } catch (historyError) {
                console.error(`DEBUG: Error fetching historical data for ${symbol}:`, historyError);
            }

            // --- Calculate Change and Percentage Change over the period ---
            let change = 'N/A';
            let changePercent = 'N/A';

            if (currentPrice !== null && startPeriodPrice !== null && startPeriodPrice !== 0) {
                change = (currentPrice - startPeriodPrice).toFixed(2);
                changePercent = ((parseFloat(change) / startPeriodPrice) * 100).toFixed(2);
            } else if (currentPrice !== null && timeRange === '1d' && currentQuoteData !== null) {
                 // Fallback to daily change from quote if historical data isn't providing a good start price for '1d'
                 change = (currentQuoteData.change || 0).toFixed(2);
                 changePercent = (currentQuoteData.changesPercentage || 0).toFixed(2);
            }


            indicesData.push({
                symbol: symbol,
                name: companyName,
                price: currentPrice !== null ? currentPrice.toFixed(2) : 'N/A',
                change: change,
                changePercent: changePercent,
                marketCap: marketCap,
                volume: volume,
                yearHigh: yearHigh,
                yearLow: yearLow
            });
        }

        // You might consider caching 'indicesData' based on timeRange here, e.g., cache.indices[timeRange] = indicesData;
        hideLoading('indices');
        console.log('DEBUG: fetchIndexData returning formatted data:', indicesData);
        return indicesData;

    } catch (error) {
        console.error('DEBUG: Error in fetchIndexData catch block:', error);
        showError('indices');
        return []; // Always return an empty array on error to prevent further TypeError
    }
}

async function fetchStockData(symbols = watchlist, timeRange = '30d') {
    try {
        console.log(`DEBUG: fetchStockData started for timeRange: ${timeRange}`);
        showLoading('stocks');

        // IMPORTANT: Assume caching is off or properly invalidated for this demo
        // if (cache.stocks && Date.now() - cache.lastUpdated < 300000) {
        //   console.log('DEBUG: fetchStockData returning from cache');
        //   return cache.stocks;
        // }

        const stocksData = [];
        const { startDate, endDate } = getDatesForTimeRange(timeRange);

        for (const symbol of symbols) {
            let currentPrice = null;
            let startPeriodPrice = null;
            let companyName = symbol;
            let marketCap = 'N/A';
            let volume = 'N/A';
            let yearHigh = 'N/A';
            let yearLow = 'N/A';
            let currentQuoteData = null; // To store the full quote object if fetched successfully

            // --- 1. Fetch current quote data (for latest price, name, marketCap, volume) ---
            try {
                const quoteUrl = `${API_CONFIG.fmp.baseUrl}quote/${symbol}?apikey=${API_CONFIG.fmp.key}`;
                console.log(`DEBUG: Fetching current quote for ${symbol} from: ${quoteUrl}`);
                const quoteResponse = await fetch(quoteUrl);
                if (!quoteResponse.ok) throw new Error(`Quote network response not ok for ${symbol}: ${quoteResponse.status}`);
                const quoteJson = await quoteResponse.json();

                if (quoteJson && quoteJson.length > 0) {
                    currentQuoteData = quoteJson[0]; // Store the full quote object
                    currentPrice = currentQuoteData.price;
                    companyName = currentQuoteData.name || symbol;
                    marketCap = (currentQuoteData.marketCap / 1_000_000_000_000).toFixed(3) + 'B';
                    volume = (currentQuoteData.volume / 1_000_000).toFixed(1) + 'M';
                    yearHigh = currentQuoteData.yearHigh.toFixed(2);
                    yearLow = currentQuoteData.yearLow.toFixed(2);
                } else {
                    console.warn(`DEBUG: No current quote data found for ${symbol}.`);
                }
            } catch (quoteError) {
                console.error(`DEBUG: Error fetching current quote for ${symbol}:`, quoteError);
            }

            // --- 2. Fetch historical data for the period ---
            try {
                if (timeRange === '1d' && currentQuoteData !== null) {
                    startPeriodPrice = currentPrice - (currentQuoteData.change || 0);
                    if (startPeriodPrice === 0) startPeriodPrice = currentPrice;
                } else {
                    const historyUrl = `${API_CONFIG.fmp.baseUrl}historical-price-full/${symbol}?from=${startDate}&to=${endDate}&apikey=${API_CONFIG.fmp.key}`;
                    console.log(`DEBUG: Fetching historical data for ${symbol} from: ${historyUrl}`);
                    const historyResponse = await fetch(historyUrl);
                    if (!historyResponse.ok) throw new Error(`Historical network response not ok for ${symbol}: ${historyResponse.status}`);
                    const historyJson = await historyResponse.json();

                    if (historyJson && historyJson.historical && historyJson.historical.length > 0) {
                        const oldestEntryInPeriod = historyJson.historical[historyJson.historical.length - 1];
                        startPeriodPrice = oldestEntryInPeriod.close;

                        if (currentPrice === null) {
                            currentPrice = historyJson.historical[0].close;
                        }
                    } else {
                        console.warn(`DEBUG: No historical data found for ${symbol} for range ${startDate} to ${endDate}.`);
                    }
                }
            } catch (historyError) {
                console.error(`DEBUG: Error fetching historical data for ${symbol}:`, historyError);
            }

            // --- Calculate Change and Percentage Change over the period ---
            let change = 'N/A';
            let changePercent = 'N/A';

            if (currentPrice !== null && startPeriodPrice !== null && startPeriodPrice !== 0) {
                change = (currentPrice - startPeriodPrice).toFixed(2);
                changePercent = ((parseFloat(change) / startPeriodPrice) * 100).toFixed(2);
            } else if (currentPrice !== null && timeRange === '1d' && currentQuoteData !== null) {
                 change = (currentQuoteData.change || 0).toFixed(2);
                 changePercent = (currentQuoteData.changesPercentage || 0).toFixed(2);
            }

            stocksData.push({
                symbol: symbol,
                name: companyName,
                price: currentPrice !== null ? currentPrice.toFixed(2) : 'N/A',
                change: change,
                changePercent: changePercent,
                marketCap: marketCap,
                volume: volume,
                yearHigh: yearHigh,
                yearLow: yearLow
            });
        }

        // Cache 'stocksData' based on timeRange if needed later
        // e.g., cache.stocks[timeRange] = stocksData;
        hideLoading('stocks');
        console.log('DEBUG: fetchStockData returning formatted data:', stocksData);
        return stocksData;

    } catch (error) {
        console.error('DEBUG: Error in fetchStockData catch block:', error);
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
            cache.stocks = null;
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