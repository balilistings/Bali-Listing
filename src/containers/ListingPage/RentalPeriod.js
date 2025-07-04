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
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration
 * @returns React.Fragment containing aforementioned components
 */
const RentalPeriod = props => {
  const { publicData, metadata, listingFieldConfigs, categoryConfiguration } = props;

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

  return (
    <>
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <PropertyGroup
            id="ListingPage.amenities"
            options={fieldProps.options}
            selectedOptions={fieldProps.selectedOptions}
            twoColumns={fieldProps.options.length > 5}
            showUnselectedOptions={fieldProps.showUnselectedOptions}
            rootClassName={css.rentalPeriod}
          />
        ) : null;
      })}

      {publicData.Freehold === 'leasehold' && (
        <PropertyGroup
          id="ListingPage.amenities"
          options={[{ key: 'leasehold', label: 'Leasehold' }]}
          selectedOptions={['leasehold']}
          twoColumns={false}
          showUnselectedOptions={false}
          rootClassName={css.rentalPeriod}
        />
      )}
    </>
  );
};

export default RentalPeriod;
