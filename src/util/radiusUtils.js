/**
 * Utility functions for converting between radius (km) and bounding box coordinates
 * Using Google Maps bounds format: [minLat, minLng, maxLat, maxLng]
 */

/**
 * Convert radius in kilometers to bounding box
 * Formula accounts for Earth's curvature
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} [maxLat, maxLng, minLat, minLng] (Google Maps format: north, east, south, west)
 */
export const radiusToBounds = (lat, lng, radiusKm) => {
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

  // API expects Google Maps format: [maxLat, maxLng, minLat, minLng]
  return [maxLat, maxLng, minLat, minLng];
};

/**
 * Convert bounds to radius in kilometers
 * Calculates the approximate radius from center to corner of bounds
 * @param {number} minLat
 * @param {number} minLng
 * @param {number} maxLat
 * @param {number} maxLng
 * @returns {number} Radius in kilometers
 */
export const boundsToRadius = (minLat, minLng, maxLat, maxLng) => {
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate distance to each corner and take average
  const distanceToCorner = (lat, lng) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat - centerLat) * Math.PI) / 180;
    const dLng = ((lng - centerLng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((centerLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const corners = [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, minLng],
    [maxLat, maxLng],
  ];

  const distances = corners.map(([lat, lng]) => distanceToCorner(lat, lng));
  return Math.round(Math.max(...distances));
};

/**
 * Get center point of bounds
 * @param {number} minLat
 * @param {number} minLng
 * @param {number} maxLat
 * @param {number} maxLng
 * @returns {Object} { lat, lng }
 */
export const getBoundsCenter = (minLat, minLng, maxLat, maxLng) => {
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
};

/**
 * Format bounds array to API string format
 * bounds=-8.4045687,115.41481479,-8.62034663,115.25825961
 * @param {Array} bounds - [maxLat, maxLng, minLat, minLng] (Google Maps format: north, east, south, west)
 * @returns {string} bounds query param value
 */
export const formatBoundsForAPI = bounds => {
  if (!bounds || bounds.length !== 4) return null;
  return bounds.join(',');
};

/**
 * Parse API bounds string to array
 * @param {string} boundsStr - "minLat,minLng,maxLat,maxLng"
 * @returns {Array|null} [minLat, minLng, maxLat, maxLng] or null
 */
export const parseBoundsFromAPI = boundsStr => {
  if (!boundsStr) return null;
  const parts = boundsStr.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return parts;
};
