import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import IconCollection from '../../../components/IconCollection/IconCollection';

import css from './ProfileSearchFilterMobile.module.css';

const ProfileSearchFilterMobile = props => {
  const { isMapView, onToggleMapView, onOpenCustomFilters, className, rootClassName } = props;

  const classes = classNames(rootClassName || css.root, className, {
    [css.isMapViewOpen]: isMapView,
  });

  return (
    <div className={classes}>
      <div className={css.header}>
        <div className={css.titleIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L4 9V21H9V15H15V21H20V9L12 3Z" fill="#F74DF4"/>
          </svg>
        </div>
        <h2 className={css.title}>
          <FormattedMessage id="ProfilePage.listingsTitleNoCount" />
        </h2>
      </div>

      <div className={css.buttons}>
        <button className={css.button} onClick={onOpenCustomFilters}>
          <span className={css.icon}>
            <IconCollection name="filter_icon" />
          </span>
          <FormattedMessage id="SearchFiltersMobile.filtersButtonLabel" />
        </button>

        <button
          className={classNames(css.button, { [css.buttonActive]: isMapView })}
          onClick={onToggleMapView}
        >
          <span className={css.icon}>
            {isMapView ? (
              <svg width="18" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.02344 9.00391H7.83594M5.02344 11.2539H7.83594M5.02344 13.5039H7.83594M10.0859 14.0664H11.7734C12.221 14.0664 12.6502 13.8886 12.9667 13.5721C13.2831 13.2557 13.4609 12.8265 13.4609 12.3789V4.58491C13.4609 3.73366 12.8272 3.01141 11.9789 2.94091C11.6984 2.91764 11.4177 2.89764 11.1367 2.88091M11.1367 2.88091C11.1865 3.04222 11.211 3.21009 11.2109 3.37891C11.2109 3.52809 11.1517 3.67116 11.0462 3.77665C10.9407 3.88214 10.7976 3.94141 10.6484 3.94141H7.27344C6.96294 3.94141 6.71094 3.68941 6.71094 3.37891C6.71094 3.20566 6.73719 3.03841 6.78594 2.88091M11.1367 2.88091C10.9244 2.19241 10.2824 1.69141 9.52344 1.69141H8.39844C8.03787 1.69149 7.6868 1.80701 7.39663 2.02106C7.10647 2.23511 6.89246 2.53643 6.78594 2.88091M6.78594 2.88091C6.50394 2.89816 6.22344 2.91841 5.94294 2.94091C5.09469 3.01141 4.46094 3.73366 4.46094 4.58491V6.19141M4.46094 6.19141H1.92969C1.46394 6.19141 1.08594 6.56941 1.08594 7.03516V15.4727C1.08594 15.9384 1.46394 16.3164 1.92969 16.3164H9.24219C9.70794 16.3164 10.0859 15.9384 10.0859 15.4727V7.03516C10.0859 6.56941 9.70794 6.19141 9.24219 6.19141H4.46094ZM3.33594 9.00391H3.34194V9.00991H3.33594V9.00391ZM3.33594 11.2539H3.34194V11.2599H3.33594V11.2539ZM3.33594 13.5039H3.34194V13.5099H3.33594V13.5039Z" stroke="#F74DF4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.02344 4.06605V10.2535M10.5234 5.75355V11.941M10.9007 14.5645L14.5569 12.7368C14.8427 12.5943 15.0234 12.3018 15.0234 11.9823V2.61855C15.0234 1.99155 14.3634 1.58355 13.8024 1.86405L10.9007 3.31455C10.6629 3.4338 10.3832 3.4338 10.1462 3.31455L6.40069 1.44255C6.28355 1.384 6.15439 1.35352 6.02344 1.35352C5.89248 1.35352 5.76332 1.384 5.64619 1.44255L1.98994 3.2703C1.70344 3.41355 1.52344 3.70605 1.52344 4.0248V13.3886C1.52344 14.0156 2.18344 14.4236 2.74444 14.1431L5.64619 12.6925C5.88394 12.5733 6.16369 12.5733 6.40069 12.6925L10.1462 14.5653C10.3839 14.6838 10.6637 14.6838 10.9007 14.5653V14.5645Z" stroke="#F74DF4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <FormattedMessage id={isMapView ? 'SearchFiltersMobile.list' : 'SearchFiltersMobile.openMapView'} />
        </button>
      </div>
    </div>
  );
};

export default ProfileSearchFilterMobile;