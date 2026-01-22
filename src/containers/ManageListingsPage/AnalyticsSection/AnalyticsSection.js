import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import queryString from 'query-string';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { get } from '../../../util/api';
import {
  IconAnalyticsClick,
  IconAnalyticsChart,
  IconAnalyticsTitle,
} from '../../../components/IconAnalytics/IconAnalytics';
import css from './AnalyticsSection.module.css';

// Set to true to use mock data for testing/development
const USE_MOCK_DATA = false;

const generateMockData = (range, intl) => {
  const categories = [];
  const contactClicks = [];
  const listingViews = [];

  for (let i = range - 1; i >= 0; i--) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);

    categories.push(intl.formatDate(dateObj, { day: 'numeric', month: 'short' }));
    // Generate some random but somewhat realistic looking data
    contactClicks.push(Math.floor(Math.random() * 50) + 20);
    listingViews.push(Math.floor(Math.random() * 100) + 100);
  }

  return { categories, contactClicks, listingViews };
};

const AnalyticsSection = ({ currentUser }) => {
  const [data, setData] = useState({ categories: [], contactClicks: [], listingViews: [] });
  const [summary, setSummary] = useState({
    totalContactClicks: 0,
    totalListingViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [range, setRange] = useState(30);
  const [isClient, setIsClient] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (USE_MOCK_DATA) {
        const mock = generateMockData(range, intl);
        setData(mock);
        setSummary({
          totalContactClicks: mock.contactClicks.reduce((sum, val) => sum + val, 0),
          totalListingViews: mock.listingViews.reduce((sum, val) => sum + val, 0),
        });
        setLoading(false);
        return;
      }

      if (!currentUser?.id?.uuid) return;

      try {
        setLoading(true);

        const queryParams = {
          eventNames: 'click_contact_owner,visit_listing_page',
        };
        const queryPath = `/api/analytics/events?${queryString.stringify(queryParams)}`;

        const response = await get(queryPath);

        let { timeSeries } = response;
        const safeTimeSeries = timeSeries || [];
        const filteredTimeSeries = safeTimeSeries.slice(-range);

        const categories = [];
        const contactClicks = [];
        const listingViews = [];

        filteredTimeSeries.forEach(item => {
          const year = parseInt(item.date.substring(0, 4), 10);
          const month = parseInt(item.date.substring(4, 6), 10) - 1;
          const day = parseInt(item.date.substring(6, 8), 10);
          const dateObj = new Date(year, month, day);

          categories.push(intl.formatDate(dateObj, { day: 'numeric', month: 'short' }));
          contactClicks.push(item.click_contact_owner || 0);
          listingViews.push(item.visit_listing_page || 0);
        });

        setData({ categories, contactClicks, listingViews });

        setSummary({
          totalContactClicks: contactClicks.reduce((sum, val) => sum + val, 0),
          totalListingViews: listingViews.reduce((sum, val) => sum + val, 0),
        });
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

  const chartOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Mulish, sans-serif',
      background: 'transparent',
    },
    colors: ['#0063F7', '#06C270'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    grid: {
      borderColor: '#C4C4C4',
      strokeDashArray: 0,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    xaxis: {
      categories: data.categories,
      axisBorder: { show: true, color: '#C4C4C4' },
      axisTicks: { show: true, color: '#C4C4C4' },
      labels: {
        style: {
          colors: '#818181',
          fontSize: '10px',
        },
        offsetY: 0,
        rotate: 0,
        hideOverlappingLabels: true,
      },
      tickAmount: 3, // Matches the 4-tick look (Start, Middle 1, Middle 2, End)
    },
    yaxis: {
      min: 0,
      max: 250,
      tickAmount: 5,
      labels: {
        style: {
          colors: '#818181',
          fontSize: '10px',
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontWeight: 700,
      fontFamily: 'Mulish, sans-serif',
      labels: {
        colors: '#231F20',
      },
      markers: {
        width: 12,
        height: 12,
        radius: 12,
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 16,
      },
    },
    tooltip: {
      style: {
        fontSize: '12px',
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          xaxis: {
            tickAmount: 3,
          },
          legend: {
            fontSize: '10px',
            itemMargin: {
              horizontal: 5,
              vertical: 8,
            },
          },
        },
      },
      {
        breakpoint: 1244,
        options: {
          xaxis: {
            tickAmount: range === 30 ? 6 : 7,
          },
          legend: {
            fontSize: '14px',
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: 'Total contact clicks',
      data: data.contactClicks,
    },
    {
      name: 'Total listing views',
      data: data.listingViews,
    },
  ];

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
            isClient && (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                width="100%"
                height="100%"
              />
            )
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
