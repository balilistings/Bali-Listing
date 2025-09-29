const https = require('https');

const cache = {
  rate: null,
  lastFetched: null,
};

const CACHE_DURATION = 8 * 1000 * 60 * 60; // 8 hour

const fetchRate = () => {
  return new Promise((resolve, reject) => {
    const now = Date.now();

    if (cache.rate && cache.lastFetched && now - cache.lastFetched < CACHE_DURATION) {
      resolve({ IDR: 1, USD: cache.rate });
      return;
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'YOUR_DUMMY_API_KEY';
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/IDR/USD`;

    https.get(url, apiRes => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        try {
          const ratesData = JSON.parse(data);
          if (ratesData.result === 'success' && ratesData.conversion_rate) {
            const rate = ratesData.conversion_rate;
            cache.rate = rate;
            cache.lastFetched = now;
            resolve({ IDR: 1, USD: rate });
          } else {
            console.error('Error fetching currency conversion rates:', ratesData['error-type']);
            reject(new Error('Could not retrieve conversion rates.'));
          }
        } catch (e) {
          console.error('Error parsing currency conversion response:', e);
          reject(new Error('Error parsing currency conversion response.'));
        }
      });
    }).on('error', err => {
      console.error('Error fetching currency conversion rates:', err);
      reject(new Error('Error fetching currency conversion rates.'));
    });
  });
};

module.exports = { fetchRate };
