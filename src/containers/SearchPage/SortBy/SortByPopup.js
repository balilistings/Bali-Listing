import React, { useState } from 'react';
import classNames from 'classnames';

import { Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';
import css from './SortByPopup.module.css';

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

const SortByIcon = props => {
  const classes = classNames(css.icon, props.className);
  // extra small arrow head (down)
  return (
    <svg className={classes}width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.60409 0.78987C6.70956 0.684533 6.85253 0.625366 7.00159 0.625366C7.15066 0.625366 7.29362 0.684533 7.39909 0.78987L13.0241 6.41487C13.1235 6.5215 13.1775 6.66254 13.175 6.80826C13.1724 6.95399 13.1134 7.09303 13.0103 7.19609C12.9073 7.29915 12.7682 7.35818 12.6225 7.36075C12.4768 7.36332 12.3357 7.30923 12.2291 7.20987L7.00159 1.98237L1.77409 7.20987C1.66746 7.30923 1.52643 7.36332 1.3807 7.36075C1.23498 7.35818 1.09594 7.29915 0.992878 7.19609C0.889818 7.09303 0.830784 6.95399 0.828213 6.80826C0.825641 6.66254 0.879734 6.5215 0.979094 6.41487L6.60409 0.78987Z" fill="#F74DF4"/>
    </svg>
    
  );
};

/**
 * SortByPopup component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.menuLabelRootClassName] - Custom class that extends the default class for the menu label
 * @param {string} props.urlParam - The url param
 * @param {string} props.label - The label
 * @param {Function} props.onSelect - The function to handle the select
 * @param {Array<Object>} props.options - The options [{ key: string, label: string }]
 * @param {string} [props.initialValue] - The initial value
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @returns {JSX.Element}
 */
const SortByPopup = props => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    rootClassName,
    className,
    menuLabelRootClassName,
    urlParam,
    label,
    options,
    initialValue,
    contentPlacementOffset = 0,
    onSelect,
    mode,
  } = props;

  const onToggleActive = isOpenParam => {
    setIsOpen(isOpenParam);
  };

  const selectOption = (urlParameter, option) => {
    setIsOpen(false);
    onSelect(urlParameter, option);
  };

  // resolve menu label text and class
  const menuLabel = initialValue ? optionLabel(options, initialValue) : label;

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(menuLabelRootClassName);
  const iconArrowClassName = isOpen ? css.iconArrowAnimation : null;

  return (
    <Menu
      className={classes}
      useArrow={false}
      contentPlacementOffset={contentPlacementOffset}
      contentPosition="left"
      onToggleActive={onToggleActive}
      isOpen={isOpen}
      preferScreenWidthOnMobile
    >
      <MenuLabel rootClassName={menuLabelClasses}>
        {
          mode === 'mobile' ? <>
            <span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 1.25391C10.0663 1.25391 12.0913 1.42791 14.0623 1.76241C14.462 1.82991 14.75 2.17941 14.75 2.58441V3.36741C14.75 3.58901 14.7064 3.80845 14.6216 4.01319C14.5367 4.21793 14.4124 4.40396 14.2557 4.56066L10.1818 8.63466C10.0251 8.79136 9.90075 8.97739 9.81595 9.18213C9.73114 9.38687 9.6875 9.6063 9.6875 9.82791V12.0232C9.68756 12.3366 9.6003 12.6439 9.43551 12.9106C9.27071 13.1773 9.0349 13.3928 8.7545 13.5329L6.3125 14.7539V9.82791C6.3125 9.6063 6.26886 9.38687 6.18405 9.18213C6.09925 8.97739 5.97495 8.79136 5.81825 8.63466L1.74425 4.56066C1.58755 4.40396 1.46325 4.21793 1.37845 4.01319C1.29364 3.80845 1.25 3.58901 1.25 3.36741V2.58441C1.25 2.17941 1.538 1.82991 1.93775 1.76241C3.94068 1.4233 5.96857 1.2532 8 1.25391Z" stroke="#F74DF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

            </span>
Sort by
          </> :
        
        <>
        {menuLabel}
        <SortByIcon className={iconArrowClassName} />
        </>}
       
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        {options.map(option => {
          // check if this option is selected
          const selected = initialValue === option.key;
          // menu item border class
          const menuItemBorderClass = selected ? css.menuItemBorderSelected : css.menuItemBorder;

          return (
            <MenuItem key={option.key}>
              <button
                className={css.menuItem}
                disabled={option.disabled}
                onClick={() => (selected ? null : selectOption(urlParam, option.key))}
              >
               
               <span>
               {option.longLabel || option.label}
               </span>
                <span className={menuItemBorderClass}>
                  <span className={css.menuItemBorderIcon}>
                
                  </span>
                </span>
              </button>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

export default SortByPopup;
