import React, { createContext, useContext, useState, useEffect } from 'react';

const LocaleContext = createContext();

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'id'];
const DEFAULT_LOCALE = 'en';

const getInitialLocale = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const pathParts = window.location.pathname.split('/').filter(p => p);
  if (pathParts.length > 0 && SUPPORTED_LOCALES.includes(pathParts[0])) {
    return pathParts[0];
  }

  return DEFAULT_LOCALE;
};

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(getInitialLocale());
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(window.__TRANSLATIONS__);
    } catch (e) {
      return {};
    }
  });

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

  const updateMessages = newMessages => {
    setMessages(newMessages);
  };

  return (
    <LocaleContext.Provider value={{ locale, messages, updateLocale, updateMessages, SUPPORTED_LOCALES, DEFAULT_LOCALE }}>
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
