import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import queryString from 'query-string';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { get } from '../../../util/api';
import {
  IconAnalyticsClick,
  IconAnalyticsChart,
  IconAnalyticsTitle,
} from '../../../components/IconAnalytics/IconAnalytics';
import css from './AnalyticsSection.module.css';

const AnalyticsSection = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalContactClicks: 0,
    totalListingViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [range, setRange] = useState(30);
  const intl = useIntl();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser?.id?.uuid) return;

      try {
        setLoading(true);

        const queryParams = {
          eventNames: 'click_contact_owner,visit_listing_page',
          // Note: Backend currently defaults to 30 days.
          // If the backend was updated to support custom ranges, we would pass it here.
        };
        const queryPath = `/api/analytics/events?${queryString.stringify(queryParams)}`;

        const response = await get(queryPath);

        let { eventCounts, timeSeries } = response;

        // If no timeSeries, default to empty array
        const safeTimeSeries = timeSeries || [];

        // Filter data based on selected range (7 or 30 days)
        const filteredTimeSeries = safeTimeSeries.slice(-range);

        // Process timeSeries into daily data points
        const chartData = filteredTimeSeries.map(item => {
          const year = parseInt(item.date.substring(0, 4), 10);
          const month = parseInt(item.date.substring(4, 6), 10) - 1;
          const day = parseInt(item.date.substring(6, 8), 10);
          const dateObj = new Date(year, month, day);

          return {
            date: intl.formatDate(dateObj, { day: 'numeric', month: 'short' }),
            contactClicks: item.click_contact_owner || 0,
            listingViews: item.visit_listing_page || 0,
          };
        });

        setData(chartData);

        // Update summary based on the visible range
        const rangeSummary = {
          totalContactClicks: filteredTimeSeries.reduce(
            (sum, d) => sum + (d.click_contact_owner || 0),
            0
          ),
          totalListingViews: filteredTimeSeries.reduce(
            (sum, d) => sum + (d.visit_listing_page || 0),
            0
          ),
        };

        setSummary(prev => ({
          ...prev,
          ...rangeSummary,
        }));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data.');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentUser, intl, range]);

  if (error) {
    return <div className={css.analyticsContainer}>{error}</div>;
  }

  // XAxis interval: for 30 days, show every 3rd label (0, 3, 6...)
  // For 7 days, show every label (interval 0)
  const xAxisInterval = range === 30 ? 2 : 0;

  return (
    <div className={css.analyticsContainer}>
      <div className={css.analyticsHeader}>
        <div className={css.analyticsTitleSection}>
          <div className={css.analyticsIconWrapper}>
            <IconAnalyticsTitle />
          </div>
          <h2 className={css.analyticsTitle}>
            <FormattedMessage
              id="ManageListingsPage.analyticsTitle"
              defaultMessage="Your Listings"
            />
          </h2>
          <p className={css.analyticsSubtitle}>
            <FormattedMessage
              id="ManageListingsPage.analyticsSubtitle"
              defaultMessage="Track your reach and monitor how your listings are performing in real-time."
            />
          </p>
        </div>

        <div className={css.analyticsTopRight}>
          <div className={css.timeRangeSelector}>
            <span>Last</span>
            <select
              className={css.selectInput}
              value={range}
              onChange={e => setRange(parseInt(e.target.value, 10))}
            >
              <option value="30">30 days</option>
              <option value="7">7 days</option>
            </select>
          </div>

          <div className={css.summaryCards}>
            <div className={css.summaryCard}>
              <div className={css.cardIconBox}>
                <IconAnalyticsClick />
              </div>
              <div className={css.summaryValue}>{summary.totalContactClicks}</div>
              <div className={css.summaryLabel}>Total contact clicks</div>
            </div>

            <div className={css.summaryCard}>
              <div className={css.cardIconBox}>
                <IconAnalyticsChart />
              </div>
              <div className={css.summaryValue}>{summary.totalListingViews}</div>
              <div className={css.summaryLabel}>Total listing views</div>
            </div>
          </div>
        </div>
      </div>

      {showChart && (
        <div className={css.chartSection}>
          <div className={css.chartTitle}>Graphic for {range} days</div>
          {loading ? (
            <div className={css.loadingOverlay}>Loading data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={true}
                  horizontal={true}
                  stroke="#DDDDDD"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#818181', fontSize: 10 }}
                  interval={xAxisInterval}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#818181', fontSize: 10 }} />
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Line
                  name="Total contact clicks"
                  type="monotone"
                  dataKey="contactClicks"
                  stroke="#007BFF"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  name="Total listings views"
                  type="monotone"
                  dataKey="listingViews"
                  stroke="#2CB15D"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className={css.toggleButtonContainer}>
        <button className={css.showLessLink} onClick={() => setShowChart(!showChart)}>
          {showChart ? (
            <FormattedMessage
              id="ManageListingsPage.showLessAnalytics"
              defaultMessage="Show less analytics"
            />
          ) : (
            <FormattedMessage
              id="ManageListingsPage.showAnalytics"
              defaultMessage="Show analytics"
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalyticsSection;
