import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './MainPanelHeader.module.css';

/**
 * MainPanelHeader component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {React.Node} props.children - The children
 * @param {React.Node} props.sortByComponent - The sort by component
 * @param {boolean} props.isSortByActive - Whether the sort by is active
 * @param {boolean} props.listingsAreLoaded - Whether the listings are loaded
 * @param {number} props.resultsCount - The results count
 * @param {boolean} props.searchInProgress - Whether the search is in progress
 * @param {React.Node} props.noResultsInfo - The no results info
 * @returns {JSX.Element}
 */
const MainPanelHeader = props => {
  const {
    rootClassName,
    className,
    children,
    sortByComponent,
    isSortByActive,
    listingsAreLoaded,
    resultsCount,
    searchInProgress = false,
    noResultsInfo,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.searchOptions}>
        <div className={css.searchResultSummary}>
          <span className={css.resultsFound}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.4542 7.77289L17.1384 2.21702C17.0989 1.49326 16.5067 0.90109 15.783 0.861606L10.2403 0.558952C9.83101 0.544478 9.43623 0.676071 9.14672 0.965586L1.28535 8.82696C0.719504 9.3928 0.720814 10.2889 1.28666 10.8548L7.14519 16.7133C7.71104 17.2792 8.60719 17.2805 9.17303 16.7146L17.0344 8.85327C17.3239 8.56376 17.4687 8.18214 17.4542 7.77289ZM14.5184 3.49479C15.0316 4.00801 15.0316 4.8502 14.5184 5.36342C14.0051 5.87663 13.1616 5.87794 12.6484 5.36473C12.1352 4.85152 12.1365 4.00801 12.6497 3.49479C13.1761 2.96842 14.0051 2.98159 14.5184 3.49479Z"
                fill="#F74DF4"
              />
            </svg>
            &nbsp;&nbsp; We have&nbsp;
            {searchInProgress ? (
              <FormattedMessage id="MainPanelHeader.loadingResults" />
            ) : (
              <FormattedMessage
                id="MainPanelHeader.foundResults"
                values={{ count: resultsCount }}
              />
            )}
          </span>
        </div>
        {isSortByActive ? (
          <div className={css.sortyByWrapper}>
            <span className={css.sortyBy}>
              <FormattedMessage id="MainPanelHeader.sortBy" />
            </span>
            {sortByComponent}
          </div>
        ) : null}
      </div>

      {children}

      {noResultsInfo ? noResultsInfo : null}
    </div>
  );
};

export default MainPanelHeader;
