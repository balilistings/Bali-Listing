import React from 'react';
import css from './CategorySelector.module.css';
import { IconCollection } from '../../../../components';
import { FormattedMessage } from 'react-intl';

const categories = [
  {
    id: 'rentalvillas',
    name: 'Rentals',
    icon: <IconCollection name="rentals_icon" />,
  },
  {
    id: 'villaforsale',
    name: 'For Sale',
    icon: <IconCollection name="sale_icon" />,
  },
  {
    id: 'landforsale',
    name: 'Land',
    icon: <IconCollection name="icon_Land" />,
  },
];

function CategorySelector({ selectedCategory, onCategoryChange, history }) {
  return (
    <div className={css.container}>
      <h3 className={css.title}>
        <FormattedMessage id="FilterComponent.categoryLabel" />
      </h3>
      <div className={css.categoryGrid}>
        {categories.map(category => (
          <div>
            <div
              key={category.id}
              className={`${css.categoryCard} ${
                selectedCategory === category.id ? css.selected : ''
              }`}
              onClick={() => {
                history.push(`/s?pub_categoryLevel1=${category.id}`);
                onCategoryChange(category.id);
              }}
            >
              <div className={css.iconContainer}>
                <span className={css.icon}>{category.icon}</span>
              </div>
            </div>
            <span className={css.categoryName}>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySelector;
