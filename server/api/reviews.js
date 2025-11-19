const express = require('express');
const { getSdk, getIntegrationSdk, handleError } = require('../api-util/sdk');

const router = express.Router();

// GET /api/reviews/:listingId
// Get the average rating and review count for a listing.
router.get('/:listingId', (req, res) => {
  const { listingId } = req.params;
  const integrationSdk = getIntegrationSdk();

  integrationSdk.listings
    .show({ id: listingId, 'fields.listing': 'privateData' })
    .then(listingResponse => {
      const listing = listingResponse.data.data;
      const reviews = listing.attributes.privateData?.reviews || [];
      const reviewCount = reviews.length;

      if (reviewCount === 0) {
        res.set('Cache-Control', 'public, max-age=900'); // Cache for 15 minutes
        return res.send({
          averageRating: 0,
          reviewCount: 0,
        });
      }

      const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRating / reviewCount;

      res.set('Cache-Control', 'public, max-age=900'); // Cache for 15 minutes
      res.send({
        averageRating: parseFloat(averageRating.toFixed(2)),
        reviewCount,
      });
    })
    .catch(e => {
      handleError(res, e);
    });
});

// POST /api/reviews
// Body: { listingId, rating }
router.post('/', (req, res) => {
  const { listingId, rating } = req.body;
  const integrationSdk = getIntegrationSdk();

  const currentUserId = req.locals?.currentUser?.id;
  if (!currentUserId) {
    const error = new Error('No user found');
    error.status = 401; // Unauthorized
    return handleError(res, error);
  }

  let listingAuthorId;

  // 1. Fetch the listing that is being reviewed
  integrationSdk.listings
    .show({
      id: listingId,
      'fields.listing': 'privateData',
      include: ['author'],
    })
    .then(listingResponse => {
      const listing = listingResponse.data.data;
      listingAuthorId = listing.relationships.author.data.id;
      const reviews = listing.attributes.privateData?.reviews || [];

      // 2. Check if the user has already reviewed this listing
      const existingReview = reviews.find(r => r.authorId === currentUserId);
      if (existingReview) {
        const error = new Error('User has already reviewed this listing.');
        error.status = 409;
        throw error;
      }

      // 3. Add the new review
      const newReview = {
        authorId: currentUserId,
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
      // 4. Listing updated. Now update author's rating.
      return integrationSdk.users
        .show({
          id: listingAuthorId,
          'fields.user': 'profile.metadata',
        })
        .then(userResponse => {
          const author = userResponse.data.data;

          const metadata = author.attributes.profile.metadata || {};
          const currentRating = metadata.rating || { total: 0, count: 0 };

          const newRating = {
            total: currentRating.total + rating,
            count: currentRating.count + 1,
          };

          return integrationSdk.users
            .updateProfile({
              id: listingAuthorId,
              metadata: {
                ...metadata,
                rating: newRating,
              },
            })
            .then(() => updateResponse);
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
