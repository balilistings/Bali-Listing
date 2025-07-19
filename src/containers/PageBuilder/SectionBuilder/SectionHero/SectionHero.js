import classNames from 'classnames';
import React, { useState } from 'react';
import { Form as FinalForm, Field as FinalFormField } from 'react-final-form';
import { useHistory, useLocation } from 'react-router-dom';
import Form from '../../../../components/Form/Form';
import LocationAutocompleteInput from '../../../../components/LocationAutocompleteInput/LocationAutocompleteInput';
import { getSearchPageResourceLocatorStringParams } from '../../../../containers/SearchPage/SearchPage.shared';
import { useConfiguration } from '../../../../context/configurationContext';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { createResourceLocatorString } from '../../../../util/routes';
import Field, { hasDataInFields } from '../../Field';

import { IconCollection } from '../../../../components';
import SectionContainer from '../SectionContainer';
import css from './SectionHero.module.css';
import { SearchCTA } from '../../Primitives/SearchCTA/SearchCTA';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * Section component for a website's hero section
 * The Section Hero doesn't have any Blocks by default, all the configurations are made in the Section Hero settings
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.defaultClasses
 * @param {string} props.defaultClasses.sectionDetails
 * @param {string} props.defaultClasses.title
 * @param {string} props.defaultClasses.description
 * @param {string} props.defaultClasses.ctaButton
 * @param {string} props.sectionId id of the section
 * @param {'hero'} props.sectionType
 * @param {Object?} props.title
 * @param {Object?} props.description
 * @param {Object?} props.appearance
 * @param {Object?} props.callToAction
 * @param {Object} props.options extra options for the section component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents custom fields
 * @returns {JSX.Element} Section for article content
 */
const SectionHero = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    title,
    description,
    appearance,
    callToAction,
    options,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={classNames(rootClassName || css.root)}
      appearance={appearance}
      options={fieldOptions}
    >
      {hasHeaderFields ? (
        <header className={defaultClasses.sectionDetails}>
          {sectionId !== "hero_section" ? <Field data={title} className={defaultClasses.title} options={fieldOptions} /> : <div className={css.heroTitle}>
            <h1>
            Connecting Bali <span className={css.heroTitleSpan}>
           
              </span>Properties – Free, Direct, Simple & Safe
            </h1>
         
            </div>}
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}
      <div className={css.heroSearchWrapper}>
        <SearchCTA
          searchFields={{
            locationSearch: true,
            price: true,
          }}
        />
        {/* <FinalForm
          onSubmit={values => {
            // Build search params
            const { location, bedrooms, price } = values;
            console.log('values', values);
            let searchParams = {};
            if (location && location.selectedPlace) {
              const { search, selectedPlace } = location;
              const { origin, bounds } = selectedPlace || {};
              const originMaybe = origin ? { origin } : {};
              searchParams = {
                ...originMaybe,
                address: search,
                bounds,
              };
            }
            if (bedrooms) {
              searchParams.pub_listingType = bedrooms;
            }
            if (price) {
              searchParams.price = price;
            }
            const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
              routeConfiguration,
              routerLocation
            );
            history.push(
              createResourceLocatorString(routeName, routeConfiguration, pathParams, searchParams)
            );
          }}
          render={({ handleSubmit }) => (
            <Form
              className={css.heroSearchBar}
              onSubmit={handleSubmit}
              enforcePagePreloadFor="SearchPage"
            >
              <div className={css.heroSearchField}>
                <span className={css.heroIcon}>
                  <IconCollection name="location_icon" />
                </span>
                <div>
                  <div className={css.heroLabel}>Location</div>
                  <FinalFormField
                    name="location"
                    render={({ input, meta }) => (
                      <LocationAutocompleteInput
                        input={input}
                        meta={meta}
                        placeholder="Select Location"
                        rootClassName={css.heroLocationInput}
                        inputClassName={css.heroPlaceholder}
                      />
                    )}
                  />
                </div>
              </div>
              <div className={css.heroDivider} />
              <div className={css.heroSearchField}>
                <span className={css.heroIcon}>
                  <IconCollection name="bedroom_icon" />
                </span>
                <div>
                  <div className={css.heroLabel}>Bedrooms</div>
                  <FinalFormField
                    name="bedrooms"
                    component="select"
                    className={css.heroPlaceholder}
                  >
                    <option value="">Select Type</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </FinalFormField>
                </div>
              </div>
              <div className={css.heroDivider} />
              <div className={css.heroSearchField}>
                <span className={css.heroIcon}>
                  <IconCollection name="area_icon" />
                </span>
                <div>
                  <div className={css.heroLabel}>Price</div>
                  <FinalFormField name="price" component="select" className={css.heroPlaceholder}>
                    <option value="">Select Range</option>
                    <option value="0-1000">Under $1,000</option>
                    <option value="1000-3000">$1,000 - $3,000</option>
                    <option value="3000-5000">$3,000 - $5,000</option>
                    <option value="5000+">Over $5,000</option>
                  </FinalFormField>
                </div>
              </div>
              <button className={css.heroSearchButton} type="submit">
                <span className={css.heroSearchIcon}>
                  <IconCollection name="search_icon" />
                </span>
                Search
              </button>
            </Form>
          )}
        /> */}
      </div>
    </SectionContainer>
  );
};

export default SectionHero;
