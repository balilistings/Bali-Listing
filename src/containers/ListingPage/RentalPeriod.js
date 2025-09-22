import React from 'react';

// Utils
import { SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import {
  isFieldForCategory,
  pickCategoryFields,
  pickCustomFieldProps,
} from '../../util/fieldHelpers.js';

import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import { PropertyGroup } from '../../components';
import css from './ListingPage.module.css';

/**
 * Renders custom listing fields.
 * - SectionDetailsMaybe is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnumMaybe is used if schemaType is 'multi-enum'
 * - SectionTextMaybe is used if schemaType is 'text'
 *
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration, intl
 * @returns React.Fragment containing aforementioned components
 */
const RentalPeriod = props => {
  const { publicData, metadata, listingFieldConfigs, categoryConfiguration, intl } = props;

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration;
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  const isFieldForSelectedCategories = fieldConfig => {
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    return isTargetCategory;
  };
  const propsForCustomFields =
    pickCustomFieldProps(
      publicData,
      metadata,
      listingFieldConfigs,
      'listingType',
      isFieldForSelectedCategories
    ) || [];
  
  // Filter to only include multi-enum fields
  const multiEnumFields = propsForCustomFields.filter(
    customFieldProps => customFieldProps.schemaType === SCHEMA_TYPE_MULTI_ENUM
  );

  return (
    <>
      {multiEnumFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        // Translate option labels
        const translatedOptions = fieldProps.options.map(option => ({
          ...option,
          label: intl.formatMessage({ id: `PageBuilder.SearchCTA.PriceFilter.${option.key}` }),
        }));
        return (
          <PropertyGroup
            key={key}
            id="ListingPage.amenities"
            options={translatedOptions}
            selectedOptions={fieldProps.selectedOptions}
            twoColumns={fieldProps.options.length > 5}
            showUnselectedOptions={fieldProps.showUnselectedOptions}
            rootClassName={css.rentalPeriod}
          />
        );
      })}

      {(publicData.Freehold === 'leasehold' || publicData.Freehold === 'freehold') && (
        <PropertyGroup
          id="ListingPage.amenities"
          options={
            publicData.Freehold === 'leasehold'
              ? [{ key: 'leasehold', label: 'Leasehold' }]
              : [{ key: 'freehold', label: 'Freehold' }]
          }
          selectedOptions={publicData.Freehold === 'leasehold' ? ['leasehold'] : ['freehold']}
          twoColumns={false}
          showUnselectedOptions={false}
          rootClassName={css.rentalPeriod}
        />
      )}
    </>
  );
};

export default RentalPeriod;
