import React from 'react';
import css from './ListingPage.module.css';

// Utils
import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT, SCHEMA_TYPE_YOUTUBE } from '../../util/types';
import {
  isFieldForCategory,
  pickCategoryFields,
  pickCustomFieldProps,
} from '../../util/fieldHelpers.js';

import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';
import { IconCollection } from '../../components/index.js';

const amenities = [
  { icon: <IconCollection name="wifi" />, label: 'Wifi' },
  { icon: <IconCollection name="pool" />, label: 'Pool' },
  { icon: <IconCollection name="gym" />, label: 'Gym' },
  { icon: <IconCollection name="pet" />, label: 'Pet Friendly' },
  { icon: <IconCollection name="desk" />, label: 'Working desk' },
  { icon: <IconCollection name="parking" />, label: 'Car parking' },
  { icon: <IconCollection name="kitchen" />, label: 'Kitchen' },
  { icon: <IconCollection name="aircondition" />, label: 'Airconditioning' },
];

const services = [
  {
    icon: <IconCollection name="cleaning" />,
    label: 'Cleaning',
    value: '2x Weekly cleaning',
    status: 'check', // custom = has value, check = included, x = not included

  },
  {
    icon: <IconCollection name="elictricity" />,
    label: 'Electricity',
    value: '',
    status: 'check',
  },
  {
    icon: <IconCollection name="pool" />,
    label: 'Pool maintenance',
    value: '',
    status: 'x',
  },
];

const propertyDetails = [
  { icon: <IconCollection name="living" />, label: 'Living', value: 'Open' },
  { icon: <IconCollection name="furnished" />, label: 'Furnished', value: 'Yes' },
];

/**
 * Renders custom listing fields.
 * - SectionDetailsMaybe is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnumMaybe is used if schemaType is 'multi-enum'
 * - SectionTextMaybe is used if schemaType is 'text'
 *
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration
 * @returns React.Fragment containing aforementioned components
 */
const CustomListingFields = props => {
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
  console.log(isFieldForSelectedCategories)
  return (
    <>
      {/* <SectionDetailsMaybe {...props} isFieldForCategory={isFieldForSelectedCategories} />
    {propsForCustomFields.map(customFieldProps => {
      const { schemaType, key, ...fieldProps } = customFieldProps;
      
      return schemaType === SCHEMA_TYPE_TEXT ? (
        <SectionTextMaybe key={key} {...fieldProps} />
      ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
        <SectionYoutubeVideoMaybe key={key} {...fieldProps} />
      ) : null;
    })} */}
      <div className={css.amenitiesContainer} id="amenities">
        <h2 className={css.amenitiesTitle} >Amenities</h2>
        <div className={css.amenitiesGrid}>
          {amenities.map(a => (
            <div key={a.label} className={css.amenityItem}>
              <span className={css.amenityIcon}>{a.icon}</span>
              <span className={css.amenityLabel}>{a.label}</span>
            </div>
          ))}
        </div>

        <div className={css.servicesContainerWrapper}>
          <h2 className={css.servicesTitle}>Services included</h2>
          <div className={css.servicesContainer}>
            {services.map(s => (
              <div
                key={s.label}
                className={
                  s.status === 'check'
                    ? `${css.serviceItem} ${css.active}`
                    : css.serviceItem
                }
              >
                <div>
                  <span className={css.serviceIcon}>{s.icon}</span>
                  <span className={css.serviceLabel}>{s.label}:</span>

                </div>

                <div className={css.serviceValueContainer}>
                  {s.value && (
                    <span className={css.serviceValue}>{s.value}</span>
                  )}
                  {s.status === 'check' ?
                    <span className={css.serviceCheck}><IconCollection name="check" /></span>
                    :
                    <span className={css.serviceX}><IconCollection name="x" /></span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={css.propertyDetailsContainer}>
          <h2 className={css.propertyDetailsTitle}>Property Details</h2>
          <div className={css.propertyDetailList}>
            {propertyDetails.map(d => (
              <div key={d.label} className={css.propertyDetailItem}>
                <span className={css.propertyDetailLabelWrapper}>
                  <span className={css.propertyDetailIcon}>{d.icon}</span>
                  <span className={css.propertyDetailLabel}>{d.label}</span>
                </span>
                <span className={css.propertyDetailValue}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>

  );
};

export default CustomListingFields;
