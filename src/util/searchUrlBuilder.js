/**
 * Utility function to convert radius to bounds string
 */
const radiusToBoundsString = (lat, lng, radiusKm) => {
  const R = 6371; // Earth's radius in km

  // Angular distance in radians
  const angularDistance = radiusKm / R;

  // Convert center to radians
  const latRad = (lat * Math.PI) / 180;

  // Calculate bounds
  const minLat = lat - (angularDistance * 180) / Math.PI;
  const maxLat = lat + (angularDistance * 180) / Math.PI;
  const minLng = lng - (angularDistance * 180) / Math.PI / Math.cos(latRad);
  const maxLng = lng + (angularDistance * 180) / Math.PI / Math.cos(latRad);

  // API expects: [maxLat, maxLng, minLat, minLng]
  const bounds = [maxLat, maxLng, minLat, minLng];

  // Return URL-encoded bounds string
  return `bounds=${bounds.map(b => b.toFixed(8)).join('%2C')}`;
};

/**
 * Builds a search URL from filters used in the chatbot
 * @param {Object} filtersUsed - The filters object from chatbot response
 * @param {Object} coords - Optional coordinates {lat, lng} for bounds
 * @returns {string} - URL search parameters string (e.g., "s?pub_bathrooms=1&pub_bedrooms=1...")
 */
const buildSearchUrl = (filtersUsed = {}, coords) => {
  const params = [];

  // Special handling for price range (combines price_min and price_max)
  if (filtersUsed.price_min !== null || filtersUsed.price_max !== null) {
    const min = filtersUsed.price_min ? filtersUsed.price_min * 100 : 0;
    const max = filtersUsed.price_max ? filtersUsed.price_max * 100 : 999000000000;
    params.push(`price=${min}%2C${max}`);
  }

  // Add bounds if coords are provided
  if (coords && coords.lat !== undefined && coords.lng !== undefined) {
    params.push(radiusToBoundsString(coords.lat, coords.lng, 5));
  }

  // Map filters_used keys to URL parameter names
  const keyMap = {
    bedrooms: 'pub_bedrooms',
    bathrooms: 'pub_bathrooms',
    pool: 'pub_pool',
    wifi: 'pub_wifi',
    closed_living: 'pub_closed_living',
    price_order: 'sort',
    category: 'pub_categoryLevel1',
  };

  // Value transformations
  const valueMap = {
    pub_categoryLevel1: (value) => value,
    // Convert price order
    sort: (value) => {
      if (value === 'asc') return '-price';
      if (value === 'desc') return 'price';
      return value;
    },
  };

  Object.keys(filtersUsed).forEach(key => {
    const value = filtersUsed[key];
    if (value === null || value === undefined) return;

    const urlKey = keyMap[key];
    if (!urlKey) return;

    // Apply value transformation if exists
    const transformedValue = valueMap[urlKey] ? valueMap[urlKey](value) : value;

    params.push(`${urlKey}=${transformedValue}`);
  });

  return params.length > 0 ? `s?${params.join('&')}` : 's';
};

export { buildSearchUrl };
