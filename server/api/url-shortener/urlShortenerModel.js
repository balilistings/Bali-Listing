// This model is now using Supabase.
// Make sure you have created the `url_mapping` table in your Supabase project with the following columns:
// - short_code: TEXT (Primary Key)
// - original_url: TEXT
// - created_at: TIMESTAMPTZ (default: now())

const supabase = require('../../api-util/supabase');
const supabaseService = require('../../api-util/supabaseService');

/**
 * Save a URL mapping to the database
 * @param {string} shortCode - The short code for the URL
 * @param {string} originalUrl - The original URL
 * @returns {Promise} - Resolves with the saved record
 */
const saveUrlMapping = async (shortCode, originalUrl) => {
  const { data, error } = await supabaseService
    .from('url_mapping')
    .insert([
      { short_code: shortCode, original_url: originalUrl },
    ])
    .select();

  if (error) {
    throw error;
  }
  // The select() returns an array, so we take the first element.
  return data ? data[0] : null;
};

/**
 * Find original URL by short code
 * @param {string} shortCode - The short code to look up
 * @returns {Promise} - Resolves with the original URL or null if not found
 */
const findOriginalUrl = async (shortCode) => {
  const { data, error } = await supabaseService
    .from('url_mapping')
    .select('original_url')
    .eq('short_code', shortCode)
    .single();
    
console.log("findOriginalUrl", shortCode, data, error);

  if (error) {
    // PGRST116: "Not a single row was found"
    // If no record is found, Supabase returns an error. We want to return null instead.
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data ? data.original_url : null;
};

module.exports = {
  saveUrlMapping,
  findOriginalUrl
};