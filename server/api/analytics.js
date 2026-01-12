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
let analyticsDataClient = null;
if (process.env.GOOGLE_ANALYTICS_API_JSON_KEY) {
  try {
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(process.env.GOOGLE_ANALYTICS_API_JSON_KEY),
    });
  } catch (e) {
    console.error('Failed to parse GOOGLE_ANALYTICS_API_JSON_KEY:', e);
  }
}

const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

/**
 * GET /api/analytics/events
 *
 * Retrieves event counts for a specific listing or author from Google Analytics.
 *
 * Query parameters:
 * - listingId (string, optional): The UUID of the listing to fetch analytics for.
 * - authorId (string, optional): The UUID of the author to fetch analytics for.
 * - eventNames (string, optional): Comma-separated list of event names (default: 'click_contact_owner').
 *
 * Response:
 * - listingId (string, optional): The ID of the listing.
 * - authorId (string, optional): The ID of the author.
 * - startDate (string): The start date of the reporting period.
 * - endDate (string): The end date of the reporting period.
 * - eventCounts (object): A map of event names to their respective total counts.
 * - timeSeries (array): An array of objects containing daily counts for the requested events.
 *
 * Example Response:
 * {
 *   "listingId": "550e8400-e29b-41d4-a716-446655440000",
 *   "startDate": "30daysAgo",
 *   "endDate": "today",
 *   "eventCounts": {
 *     "click_contact_owner": 15
 *   },
 *   "timeSeries": [
 *     { "date": "20231001", "click_contact_owner": 2 },
 *     { "date": "20231002", "click_contact_owner": 0 },
 *     { "date": "20231003", "click_contact_owner": 5 }
 *   ]
 * }
 */
router.get('/events', async (req, res) => {
  const { listingId, eventNames: eventNamesQuery } = req.query;
  const authorId = req.locals.currentUser.id;
  if (!authorId) {
    return res.status(400).send({
      error: 'Missing required query parameters: authorId must be provided.',
    });
  }
  const startDate = '30daysAgo';
  const endDate = 'today';

  if (!listingId && !authorId) {
    return res.status(400).send({
      error: 'Missing required query parameters: listingId or authorId must be provided.',
    });
  }

  // Add failsafe for analyticsDataClient and propertyId
  if (!analyticsDataClient) {
    return res.status(500).send({ error: 'Google Analytics API credentials are not configured.' });
  }
  if (!propertyId) {
    return res.status(500).send({ error: 'Google Analytics property ID is not configured.' });
  }

  const eventNames = eventNamesQuery
    ? eventNamesQuery.split(',').map(name => name.trim())
    : ['click_contact_owner', 'visit_listing_page'];

  try {
    const expressions = [];

    if (authorId) {
      expressions.push({
        filter: {
          fieldName: 'customEvent:author_id',
          stringFilter: { value: String(authorId) },
        },
      });
    }

    if (eventNames.length > 0) {
      expressions.push({
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: eventNames },
        },
      });
    }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [{ name: 'date' }, { name: 'eventName' }, { name: 'customEvent:author_id' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions,
        },
      },
    });

    const eventCounts = eventNames.reduce((acc, eventName) => {
      acc[eventName] = 0;
      return acc;
    }, {});

    const dailyData = {};

    if (response.rows && response.rows.length > 0) {
      response.rows.forEach(row => {
        const date = row.dimensionValues[0].value;
        const eventName = row.dimensionValues[1].value;
        const count = parseInt(row.metricValues[0].value, 10);

        if (eventCounts.hasOwnProperty(eventName)) {
          eventCounts[eventName] += count;

          if (!dailyData[date]) {
            dailyData[date] = { date };
            eventNames.forEach(name => (dailyData[date][name] = 0));
          }
          dailyData[date][eventName] += count;
        }
      });
    }

    // Convert dailyData object to a sorted array
    const timeSeries = Object.keys(dailyData)
      .sort()
      .map(date => dailyData[date]);

    res.set('Cache-Control', 'private, max-age=3600');
    res.set('Vary', 'Cookie');
    res.status(200).send({
      // listingId,
      authorId,
      eventCounts,
      timeSeries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while fetching analytics data.' });
  }
});

module.exports = router;
