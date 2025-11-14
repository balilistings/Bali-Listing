import React from 'react';
import classNames from 'classnames';
import { Menu, MenuLabel, MenuContent, MenuItem } from '../../../../../components/index.js';
import { ReactComponent as MenuIcon } from './lang-menu.svg';
import { useLanguageCurrency } from '../../useLanguageCurrency.js';

import topbarCss from '../TopbarDesktop.module.css';
import css from './LanguageCurrencyMenu.module.css';
import IconLanguage from '../../../../../components/IconLanguage/IconLanguage.js';
import IconCurrency from '../../../../../components/IconCurrency/IconCurrency.js';
import { FormattedMessage } from 'react-intl';

const LanguageCurrencyMenu = ({ config, currentPage, scrollToBottom }) => {
  const {
    locale,
    SUPPORTED_LOCALES,
    languageNames,
    selectedCurrency,
    currencies,
    onLanguageChange,
    handleCurrencyChange,
    showLanguageToggler,
    showCurrencyToggler,
  } = useLanguageCurrency(config, currentPage);

  if (!showLanguageToggler && !showCurrencyToggler) {
    return null;
  }

  return (
    <Menu>
      <MenuLabel
        className={topbarCss.profileMenuLabel}
        isOpenClassName={topbarCss.profileMenuIsOpen}
      >
        <div className={classNames(css.menuIcon, scrollToBottom ? css.menuIconBottom : null)}>
          <MenuIcon />
        </div>
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        {showLanguageToggler && (
          <MenuItem key="language-section">
            <div className={css.section}>
              <p className={css.sectionTitle}>
                <IconLanguage />
                <span>
                  <FormattedMessage id="TopbarDesktop.language" />:
                </span>
              </p>
              <div className={css.optionsContainer}>
                {SUPPORTED_LOCALES.map(l => (
                  <button
                    key={l}
                    className={classNames(css.optionButton, {
                      [css.selected]: locale === l,
                    })}
                    onClick={() => onLanguageChange(l)}
                  >
                    {languageNames[l]}
                  </button>
                ))}
              </div>
            </div>
          </MenuItem>
        )}
        {showCurrencyToggler && (
          <MenuItem key="currency-section">
            <div className={css.section}>
              <p className={css.sectionTitle}>
                <IconCurrency />
                <span>
                  <FormattedMessage id="TopbarDesktop.currency" />:
                </span>
              </p>
              <div className={css.optionsContainer}>
                {currencies.map(c => (
                  <button
                    key={c.code}
                    className={classNames(css.optionButton, css.currencyOption, {
                      [css.selected]: selectedCurrency === c.code,
                    })}
                    onClick={() => handleCurrencyChange(c.code)}
                  >
                    <span className={css.currencyName}>{c.name}</span>
                    <span className={css.currencyCode}>
                      {c.code} - {c.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
};

export default LanguageCurrencyMenu;
