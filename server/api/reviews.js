const express = require('express');
const { getSdk, getIntegrationSdk, handleError } = require('../api-util/sdk');

const router = express.Router();

// POST /api/reviews
// Body: { listingId, rating }
router.post('/', (req, res) => {
  const { listingId, rating } = req.body;
  const sdk = getSdk(req, res);
  const integrationSdk = getIntegrationSdk();

  let currentUser;

  // 1. Authenticate the user
  sdk.currentUser
    .show()
    .then(response => {
      currentUser = response.data.data;
      if (!currentUser) {
        throw new Error('No user found');
      }

      // 2. Fetch the listing that is being reviewed
      return integrationSdk.listings.show({ id: listingId });
    })
    .then(listingResponse => {
      const listing = listingResponse.data.data;
      const reviews = listing.attributes.privateData?.reviews || [];

      // 3. Check if the user has already reviewed this listing
      const existingReview = reviews.find(r => r.authorId.uuid === currentUser.id.uuid);
      if (existingReview) {
        const error = new Error('User has already reviewed this listing.');
        error.status = 409; // Conflict
        throw error;
      }

      // 4. Add the new review
      const newReview = {
        authorId: currentUser.id,
        rating: rating,
      };

      const updatedPrivateData = {
        reviews: [...reviews, newReview],
      };

      return integrationSdk.listings.update({
        id: listingId,
        privateData: updatedPrivateData,
      });
    })
    .then(updateResponse => {
      // 5. Send the successful response
      res.send(updateResponse.data);
    })
    .catch(e => {
      // Handle errors, including unauthenticated (401) and conflict (409)
      handleError(res, e);
    });
});

module.exports = router;
