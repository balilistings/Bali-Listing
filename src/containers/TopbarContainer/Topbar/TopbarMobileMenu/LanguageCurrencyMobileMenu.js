import React, { useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import { IconArrowHead } from '../../../../components';
import { useLanguageCurrency } from '../useLanguageCurrency.js';

import css from './LanguageCurrencyMobileMenu.module.css';

const LanguageCurrencyMobileMenu = props => {
  const { config, currentPage } = props;
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

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

  const handleLanguageSelect = newLocale => {
    onLanguageChange(newLocale)?.then(() => {
      setLangMenuOpen(false);
    });
  };

  const handleCurrencySelect = newCurrency => {
    handleCurrencyChange(newCurrency);
    setCurrencyMenuOpen(false);
  };

  if (!showLanguageToggler && !showCurrencyToggler) {
    return null;
  }

  return (
    <>
      {showLanguageToggler && (
        <div className={css.section}>
          <button className={css.sectionTitleButton} onClick={() => setLangMenuOpen(!langMenuOpen)}>
            <FormattedMessage id="TopbarDesktop.language" />
            <IconArrowHead direction={langMenuOpen ? 'up' : 'down'} />
          </button>
          <div
            className={classNames(css.optionsContainer, {
              [css.optionsContainerOpen]: langMenuOpen,
            })}
          >
            <div className={css.optionsWrapper}>
              {SUPPORTED_LOCALES.map(l => (
                <button
                  key={l}
                  className={classNames(css.optionButton, {
                    [css.selected]: locale === l,
                  })}
                  onClick={() => handleLanguageSelect(l)}
                >
                  {languageNames[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCurrencyToggler && (
        <div className={css.section}>
          <button
            className={css.sectionTitleButton}
            onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
          >
            <span className={css.sectionTitle}>
              <FormattedMessage id="TopbarDesktop.currency" />
            </span>
            <IconArrowHead direction={currencyMenuOpen ? 'up' : 'down'} />
          </button>
          <div
            className={classNames(css.optionsContainer, {
              [css.optionsContainerOpen]: currencyMenuOpen,
            })}
          >
            <div className={css.optionsWrapper}>
              {currencies.map(c => (
                <button
                  key={c.code}
                  className={classNames(css.currencyOption, {
                    [css.selected]: selectedCurrency === c.code,
                  })}
                  onClick={() => handleCurrencySelect(c.code)}
                >
                  <span className={css.currencyName}>{c.name}</span>
                  <span className={css.currencyCode}>
                    {c.code} - {c.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageCurrencyMobileMenu;
