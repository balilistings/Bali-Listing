import React, { createContext, useContext, useState, useEffect } from 'react';

const LocaleContext = createContext();

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'id'];
const DEFAULT_LOCALE = 'en';

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  // Load saved locale from localStorage on initial render
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      // Detect browser locale as fallback
      const browserLocale = navigator.language.split('-')[0];
      if (SUPPORTED_LOCALES.includes(browserLocale)) {
        setLocale(browserLocale);
      }
    }
  }, []);

  // Save locale to localStorage whenever it changes
  useEffect(() => {
    if (locale !== DEFAULT_LOCALE) {
      localStorage.setItem('locale', locale);
    } else {
      localStorage.removeItem('locale');
    }
  }, [locale, DEFAULT_LOCALE]);

  const updateLocale = newLocale => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocale(newLocale);
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, updateLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
