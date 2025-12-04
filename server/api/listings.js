const supabaseService = require('../api-util/supabaseService');

const supabaseTableName = 'sharetribe_listings';

const updateListingState = async (req, res) => {
  const { listingId, state, listing_deleted } = req.body;

  if (!listingId || !state) {
    return res.status(400).send({ error: 'Missing listingId or state' });
  }

  const updateData = { listing_state: state };
  if (listing_deleted !== undefined) {
    updateData.listing_deleted = listing_deleted;
  }

  try {
    const { data, error } = await supabaseService
      .from(supabaseTableName)
      .update(updateData)
      .eq('listing_id', listingId)
      .select();

    if (error) {
      console.error('Error updating Supabase:', error);
      return res.status(500).send({ error: 'An error occurred while updating listing state.' });
    }

    return res.status(200).send({ success: true, data });
  } catch (err) {
    console.error('Supabase update failed:', err);
    return res.status(500).send({ error: 'An error occurred.' });
  }
};

module.exports = { updateListingState };
