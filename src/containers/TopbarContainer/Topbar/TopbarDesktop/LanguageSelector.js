import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useLocation, useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useLocale } from '../../../../context/localeContext';

import css from './LanguageSelector.module.css';

const LanguageSelector = () => {
  const { locale, updateLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE } = useLocale();
  const intl = useIntl();
  const location = useLocation();
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Language options with their display names
  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'id', name: 'Bahasa Indonesia' },
  ];

  // Get current language name
  const currentLanguage = languageOptions.find(lang => lang.code === locale) || languageOptions[0];

  // Handle language change
  const handleLanguageChange = newLocale => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    // Update the locale in context
    updateLocale(newLocale);
    
    // Set the useDefaultLocale flag appropriately
    if (newLocale === DEFAULT_LOCALE) {
      localStorage.setItem('useDefaultLocale', 'true');
    } else {
      localStorage.setItem('useDefaultLocale', 'false');
    }

    // Update the URL with the new locale
    const pathParts = location.pathname.split('/').filter(part => part !== '');

    // If the first part is a locale, replace it
    let newPath = location.pathname;
    if (pathParts.length > 0 && SUPPORTED_LOCALES.includes(pathParts[0])) {
      if (newLocale === DEFAULT_LOCALE) {
        // Remove locale prefix for default language
        newPath = '/' + pathParts.slice(1).join('/') + location.search + location.hash;
      } else {
        // Replace locale prefix
        pathParts[0] = newLocale;
        newPath = '/' + pathParts.join('/') + location.search + location.hash;
      }
    } else if (newLocale !== DEFAULT_LOCALE) {
      // Add locale prefix for non-default language
      const cleanPath = location.pathname.startsWith('/')
        ? location.pathname.substring(1)
        : location.pathname;
      newPath = `/${newLocale}/${cleanPath}${location.search}${location.hash}`;
    }

    // Navigate to the new path
    history.push(newPath);

    // Close the dropdown
    setIsOpen(false);
  };

  return (
    <div className={css.languageSelector} ref={selectorRef}>
      <button
        className={css.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={css.currentLanguage}>{currentLanguage.name}</span>
        <span className={css.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={css.dropdown}>
          <ul className={css.languageList}>
            {languageOptions.map(language => (
              <li key={language.code}>
                <button
                  className={classNames(css.languageOption, {
                    [css.active]: language.code === locale,
                  })}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  {language.name}
                  {language.code === locale && <span className={css.checkmark}>✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
