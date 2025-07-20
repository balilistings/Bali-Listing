import React from 'react';
import css from './CategorySelector.module.css';

const categories = [
  {
    id: 'rentalvillas',
    name: 'Rentals',
    icon: '🏠',
  },
  {
    id: 'villaforsale',
    name: 'For Sale',
    icon: '🏷️',
  },
  {
    id: 'landforsale',
    name: 'Land',
    icon: '🌱',
  },
];

function CategorySelector({ selectedCategory, onCategoryChange, history }) {
  return (
    <div className={css.container}>
      <h3 className={css.title}>Categories</h3>
      <div className={css.categoryGrid}>
        {categories.map(category => (
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
            <span className={css.categoryName}>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySelector;
