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
      fromSectionHero={true}
    >
      {hasHeaderFields ? (
        <header className={defaultClasses.sectionDetails}>
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
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
       
      </div>
    </SectionContainer>
  );
};

export default SectionHero;
