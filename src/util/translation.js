const getSupportedLocales = () => {
  const defaultLocale = 'en';
  const supportedLocalesEnv = process.env.REACT_APP_SUPPORTED_LOCALES;

  if (supportedLocalesEnv) {
    const locales = supportedLocalesEnv.split(',').map(l => l.trim());
    // Add 'en' if it's not already included to ensure it's always present.
    if (!locales.includes(defaultLocale)) {
      return [defaultLocale, ...locales];
    }
    return locales;
  }

  return [defaultLocale];
};

module.exports = {
  getSupportedLocales,
};