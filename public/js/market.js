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

// --- Dummy Data Configuration ---
const USE_DUMMY_DATA = false; // Set to true to use dummy data, false to use actual API calls

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
  { symbol: 'WMT', 'name': 'Walmart Inc.' },
  { symbol: 'KO', name: 'The Coca-Cola Company' }
];

// Cache System
const cache = {
  indices: null,
  stocks: null,
  news: null,
  ratings: null,
  lastUpdated: null
};

// Dynamic watchlist (initial stocks) - Now defaults to 6 stocks
let watchlist = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'];

// --- Dummy Data ---
const dummyIndexData = (timeRange) => [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '212.43', change: timeRange === '1d' ? '3.50' : '15.20', changePercent: timeRange === '1d' ? '1.67' : '7.70', marketCap: '3.250B', volume: '75.1M', yearHigh: '220.00', yearLow: '160.50' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '130.78', change: timeRange === '1d' ? '-1.25' : '-8.50', changePercent: timeRange === '1d' ? '-0.95' : '-6.00', marketCap: '3.200B', volume: '50.3M', yearHigh: '140.00', yearLow: '90.20' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: '182.56', change: timeRange === '1d' ? '5.10' : '22.80', changePercent: timeRange === '1d' ? '2.87' : '14.20', marketCap: '0.580B', volume: '80.5M', yearHigh: '200.00', yearLow: '150.10' },
];

const dummyStockData = (timeRange) => [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '212.43', change: timeRange === '1d' ? '3.50' : '15.20', changePercent: timeRange === '1d' ? '1.67' : '7.70', marketCap: '3.250B', volume: '75.1M', yearHigh: '220.00', yearLow: '160.50' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '130.78', change: timeRange === '1d' ? '-1.25' : '-8.50', changePercent: timeRange === '1d' ? '-0.95' : '-6.00', marketCap: '3.200B', volume: '50.3M', yearHigh: '140.00', yearLow: '90.20' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: '182.56', change: timeRange === '1d' ? '5.10' : '22.80', changePercent: timeRange === '1d' ? '2.87' : '14.20', marketCap: '0.580B', volume: '80.5M', yearHigh: '200.00', yearLow: '150.10' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: '185.90', change: timeRange === '1d' ? '2.00' : '10.50', changePercent: timeRange === '1d' ? '1.09' : '5.98', marketCap: '1.920B', volume: '60.2M', yearHigh: '190.00', yearLow: '145.00' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '178.15', change: timeRange === '1d' ? '-0.80' : '7.10', changePercent: timeRange === '1d' ? '-0.45' : '4.15', marketCap: '2.200B', volume: '40.7M', yearHigh: '185.00', yearLow: '130.00' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: '445.00', change: timeRange === '1d' ? '4.50' : '25.00', changePercent: timeRange === '1d' ? '1.02' : '6.00', marketCap: '3.300B', volume: '55.0M', yearHigh: '450.00', yearLow: '380.00' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', price: '500.20', change: timeRange === '1d' ? '-3.10' : '18.00', changePercent: timeRange === '1d' ? '-0.62' : '3.70', marketCap: '1.280B', volume: '35.0M', yearHigh: '520.00', yearLow: '400.00' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: '195.00', change: timeRange === '1d' ? '1.20' : '8.00', changePercent: timeRange === '1d' ? '0.62' : '4.30', marketCap: '0.570B', volume: '20.0M', yearHigh: '200.00', yearLow: '160.00' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: '68.50', change: timeRange === '1d' ? '0.50' : '3.50', changePercent: timeRange === '1d' ? '0.74' : '5.40', marketCap: '0.550B', volume: '15.0M', yearHigh: '70.00', yearLow: '60.00' },
  { symbol: 'KO', name: 'The Coca-Cola Company', price: '63.20', change: timeRange === '1d' ? '0.30' : '1.80', changePercent: timeRange === '1d' ? '0.48' : '2.90', marketCap: '0.270B', volume: '10.0M', yearHigh: '65.00', yearLow: '58.00' },
];

const dummyNewsArticles = [
  {
    title: 'Tech Giants Continue to Dominate Market as AI Sector Booms',
    description: 'Leading technology companies show strong performance driven by innovations in artificial intelligence and cloud computing. Investors remain optimistic about future growth.',
    url: 'https://example.com/news/tech-boom',
    urlToImage: 'https://images.unsplash.com/photo-1518770660439-4636190af036?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishedAt: '2025-06-14T10:00:00Z',
    source: { name: 'Financial Times' }
  },
  {
    title: 'Global Economy Shows Resilience Amidst Inflation Concerns',
    description: 'Despite persistent inflation, global economic indicators suggest a resilient recovery, with consumer spending holding up in key markets.',
    url: 'https://example.com/news/global-economy',
    urlToImage: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishedAt: '2025-06-13T15:30:00Z',
    source: { name: 'Reuters' }
  },
  {
    title: 'Oil Prices Fluctuate as Geopolitical Tensions Rise',
    description: 'Crude oil prices are experiencing volatility due to escalating geopolitical tensions in the Middle East and concerns over supply disruptions.',
    url: 'https://example.com/news/oil-prices',
    urlToImage: 'https://images.unsplash.com/photo-1518644778107-16d7a5b3997c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishedAt: '2025-06-12T09:15:00Z',
    source: { name: 'Bloomberg' }
  },
  {
    title: 'Central Banks Hint at Future Interest Rate Cuts',
    description: 'Recent statements from major central banks indicate a potential shift towards easing monetary policy later in the year, boosting market sentiment.',
    url: 'https://example.com/news/interest-rates',
    urlToImage: 'https://images.unsplash.com/photo-1590283144185-1f9e1e2d4d9b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishedAt: '2025-06-11T11:45:00Z',
    source: { name: 'Wall Street Journal' }
  },
  {
    title: 'Retail Sector Sees Mixed Results Ahead of Holiday Season',
    description: 'Early indicators for the retail sector show a mixed bag, with some segments performing strongly while others face headwinds. Analysts are revising forecasts.',
    url: 'https://example.com/news/retail-mixed',
    urlToImage: 'https://images.unsplash.com/photo-1563013544-824ae1b7c25d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishedAt: '2025-06-10T14:00:00Z',
    source: { name: 'MarketWatch' }
  },
];

const dummyAnalystRatings = [
  { symbol: 'AAPL', name: 'Apple Inc.', rating: 'Buy', ratingScore: 4.2, recommendation: 'Strong Buy' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', rating: 'Hold', ratingScore: 3.5, recommendation: 'Hold' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', rating: 'Sell', ratingScore: 2.8, recommendation: 'Underperform' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', rating: 'Buy', ratingScore: 4.0, recommendation: 'Buy' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', rating: 'Buy', ratingScore: 4.1, recommendation: 'Strong Buy' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', rating: 'Buy', ratingScore: 4.3, recommendation: 'Strong Buy' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', rating: 'Hold', ratingScore: 3.2, recommendation: 'Neutral' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', rating: 'Buy', ratingScore: 3.8, recommendation: 'Outperform' },
  { symbol: 'WMT', name: 'Walmart Inc.', rating: 'Hold', ratingScore: 3.0, recommendation: 'Hold' },
  { symbol: 'KO', name: 'The Coca-Cola Company', rating: 'Buy', ratingScore: 3.7, recommendation: 'Buy' },
];


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
async function fetchIndexData(timeRange = '1d') {
  try {
    console.log(`DEBUG: fetchIndexData started for timeRange: ${timeRange}`);
    showLoading('indices');

    if (USE_DUMMY_DATA) {
      console.log('DEBUG: Using dummy data for indices.');
      hideLoading('indices');
      return dummyIndexData(timeRange);
    }

    const symbols = ['AAPL', 'NVDA', 'TSLA']; // These are hardcoded for indices
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

    if (USE_DUMMY_DATA) {
      console.log('DEBUG: Using dummy data for stocks.');
      // Filter dummy data to only include symbols in the current watchlist
      const filteredDummyStocks = dummyStockData(timeRange).filter(stock => symbols.includes(stock.symbol));
      hideLoading('stocks');
      return filteredDummyStocks;
    }

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
    if (USE_DUMMY_DATA) {
      console.log('DEBUG: Using dummy data for news.');
      hideLoading('news');
      return dummyNewsArticles;
    }
    if (cache.news && Date.now() - cache.lastUpdated < 300000) {
      return cache.news;
    }
    const response = await fetch(
      `${API_CONFIG.newsAPI.baseUrl}top-headlines?category=business&language=en&pageSize=8&apiKey=${API_CONFIG.newsAPI.key}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    console.log('New length',data.articles.length);
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
    if (USE_DUMMY_DATA) {
      console.log('DEBUG: Using dummy data for analyst ratings.');
      // Filter dummy data to only include symbols requested
      const filteredDummyRatings = dummyAnalystRatings.filter(rating => symbols.includes(rating.symbol));
      hideLoading('ratings');
      return filteredDummyRatings;
    }
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
  const symbols = ['aapl', 'nvda', 'tsla']; // Corresponds to the IDs in your HTML
  indices.forEach((index, i) => {
    const priceElement = document.getElementById(`${symbols[i]}-price`);
    const changeElement = document.getElementById(`${symbols[i]}-change`);
    if (priceElement && changeElement) {
      priceElement.textContent = `$${index.price}`;
      changeElement.textContent = `${index.change} (${index.changePercent}%)`;
      changeElement.className = parseFloat(index.change) >= 0 ? 'positive-change small' : 'negative-change small';
    }
  });
}

function updateStockTable(stocks) {
  const tableBody = document.querySelector('#stock-table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  stocks.forEach(stock => {
    const changeClass = parseFloat(stock.change) >= 0 ? 'positive-change' : 'negative-change';
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
               onerror="this.src='/svgs/default-news.jpg'">
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
    // Adjusted percentages for a more diverse visual representation
    let buy, hold, sell, strongSell;
    if (score >= 4) { // Strong Buy/Buy
      buy = 50 + Math.floor(Math.random() * 20); // 50-70%
      hold = 15 + Math.floor(Math.random() * 10); // 15-25%
      sell = 5 + Math.floor(Math.random() * 5); // 5-10%
      strongSell = 100 - buy - hold - sell; // Remaining
    } else if (score >= 3) { // Hold/Neutral
      buy = 20 + Math.floor(Math.random() * 10); // 20-30%
      hold = 40 + Math.floor(Math.random() * 15); // 40-55%
      sell = 15 + Math.floor(Math.random() * 10); // 15-25%
      strongSell = 100 - buy - hold - sell; // Remaining
    } else { // Sell/Strong Sell
      buy = 5 + Math.floor(Math.random() * 5); // 5-10%
      hold = 10 + Math.floor(Math.random() * 10); // 10-20%
      sell = 30 + Math.floor(Math.random() * 15); // 30-45%
      strongSell = 100 - buy - hold - sell; // Remaining
    }

    // Ensure all are positive and sum to 100
    buy = Math.max(0, buy);
    hold = Math.max(0, hold);
    sell = Math.max(0, sell);
    strongSell = Math.max(0, strongSell);

    const total = buy + hold + sell + strongSell;
    // Normalize if sum is not 100 due to random variations, although it should be close
    const normalize = (val) => (val / total) * 100;

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
            <span class="badge bg-${rating.rating?.includes('Buy') ? 'success' : rating.rating?.includes('Hold') ? 'warning' : 'danger'}">${rating.recommendation || 'Neutral'}</span>
          </div>
          <div class="progress mb-2" style="height: 6px;">
            <div class="progress-bar bg-success" style="width: ${normalize(buy)}%"></div>
            <div class="progress-bar bg-info" style="width: ${normalize(hold)}%"></div>
            <div class="progress-bar bg-warning" style="width: ${normalize(sell)}%"></div>
            <div class="progress-bar bg-danger" style="width: ${normalize(strongSell)}%"></div>
          </div>
          <div class="d-flex justify-content-between small">
            <span>${buy.toFixed(0)}% Buy</span>
            <span>${hold.toFixed(0)}% Hold</span>
            <span>${sell.toFixed(0)}% Sell</span>
            <span>${strongSell.toFixed(0)}% Strong Sell</span>
          </div>
        </div>
      </div>
    `;
  });
}


// Initialization

async function initDashboard(timeRange = '1d') {
  const indices = await fetchIndexData(timeRange);
  updateIndexSection(indices);
  const stocks = await fetchStockData(watchlist, timeRange); // Uses the updated 'watchlist'
  updateStockTable(stocks);
  const news = await fetchMarketNews();
  updateNewsSection(news);
  // Now fetchAnalystRatings receives ONLY symbols from the current watchlist
  const currentWatchlistSymbols = watchlist.map(s => s); // Simple clone or just pass watchlist directly
  const ratings = await fetchAnalystRatings(currentWatchlistSymbols);
  updateAnalystRatings(ratings);

}

async function refreshStock(timeRange = '1d') {
  const indices = await fetchIndexData(timeRange);
  updateIndexSection(indices);
  const stocks = await fetchStockData(watchlist, timeRange); // Uses the updated 'watchlist'
  updateStockTable(stocks);
  // Also refresh analyst ratings when time range or watchlist changes
  const currentWatchlistSymbols = watchlist.map(s => s);
  const ratings = await fetchAnalystRatings(currentWatchlistSymbols);
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
      refreshStock(timeRange);
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
    // Filter accessibleStocks to only show those NOT already in the watchlist
    const stocksToAdd = accessibleStocks.filter(stock => !watchlist.includes(stock.symbol));

    if (stocksToAdd.length === 0) {
      alert('All available stocks are already in your market insight!');
      return; // No stocks to add, so don't show dropdown
    }

    stocksToAdd.forEach(stock => {
      const option = document.createElement('a');
      option.className = 'dropdown-item';
      option.href = '#';
      option.textContent = `${stock.symbol} - ${stock.name}`;
      option.addEventListener('click', async (e) => {
        e.preventDefault();
        const symbol = stock.symbol;

        if (!watchlist.includes(symbol)) { // Double check to prevent duplicates
          watchlist.push(symbol); // Add to the global watchlist array
          alert(`${symbol} added to market insight!`);

          // Invalidate cache and trigger a full refresh of stocks and ratings
          cache.stocks = null;
          cache.ratings = null; // Also clear ratings cache to ensure they refresh
          await refreshStock(document.getElementById('timeRangeDropdown').getAttribute('data-range') || '1d'); // Use current time range

          // In a real application, you'd send this to your backend to persist
          if (!USE_DUMMY_DATA) {
            try {
              const response = await fetch('/market/add-stock', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol })
              });
              const data = await response.json();
              console.log(data.message);
            } catch (error) {
              console.error('Error sending add stock request to backend:', error);
            }
          }
        } else {
          alert(`${symbol} is already in your market insight.`);
        }
        dropdown.remove(); // Close dropdown after selection
      });
      dropdown.appendChild(option);
    });

    // Position dropdown below the button
    const button = document.getElementById('add-stock-btn');
    // Adjust positioning if needed, depending on your CSS
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