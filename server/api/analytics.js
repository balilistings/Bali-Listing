/**
 * This module sets up an API endpoint to fetch analytics data from Google Analytics.
 * It provides an endpoint to retrieve event counts for specific listings.
 */
const express = require('express');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const router = express.Router();

/**
 * Initializes the Google Analytics Data Client.
 * The credentials are parsed from the GOOGLE_ANALYTICS_API_JSON_KEY environment variable.
 */
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_ANALYTICS_API_JSON_KEY),
});

const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

/**
 * GET /api/analytics/events
 */
 
router.get('/events', async (req, res) => {
  const { listingId } = req.query;

  const startDate = '30daysAgo';
  const endDate = 'today';

  if (!listingId) {
    return res.status(400).send({
      error: 'Missing required query parameters: listingId',
    });
  }

  const eventNames = ['click_contact_owner'];

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [{ name: 'eventName' }, { name: 'customEvent:listing_id' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'customEvent:listing_id',
                stringFilter: { value: String(listingId) },
              },
            },
          ],
        },
      },
    });

    const eventCounts = eventNames.reduce((acc, eventName) => {
      acc[eventName] = 0;
      return acc;
    }, {});

    if (response.rows && response.rows.length > 0) {
      response.rows.forEach(row => {
        const eventName = row.dimensionValues[0].value;
        const count = parseInt(row.metricValues[0].value, 10);
        if (eventCounts.hasOwnProperty(eventName)) {
          eventCounts[eventName] += count;
        }
      });
    }

    res.status(200).send({
      listingId,
      startDate,
      endDate,
      eventCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching analytics data.' });
  }
});

module.exports = router;
