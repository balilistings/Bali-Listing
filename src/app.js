import React, { useState, useEffect } from 'react';
import { any, string } from 'prop-types';

import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import loadable from '@loadable/component';
import difference from 'lodash/difference';
import mapValues from 'lodash/mapValues';
import moment from 'moment';

// Configs and store setup
import defaultConfig from './config/configDefault';
import appSettings from './config/settings';
import configureStore from './store';

// utils
import { RouteConfigurationProvider } from './context/routeConfigurationContext';
import { ConfigurationProvider } from './context/configurationContext';
import { LocaleProvider, useLocale } from './context/localeContext';
import { mergeConfig } from './util/configHelpers';
import { IntlProvider } from './util/reactIntl';
import { includeCSSProperties } from './util/style';
import { IncludeScripts } from './util/includeScripts';

import { MaintenanceMode, CookieConsent } from './components';

// routing
import routeConfiguration from './routing/routeConfiguration';
import Routes from './routing/Routes';
import { LocaleBrowserRouter, LocaleStaticRouter } from './routing/LocaleRouter';

// Sharetribe Web Template uses English translations as default translations.
import defaultMessages from './translations/en.json';

// If you want to change the language of default (fallback) translations,
// change the imports to match the wanted locale:
//
//   1) Change the language in the config.js file!
//   2) Import correct locale rules for Moment library
//   3) Use the `messagesInLocale` import to add the correct translation file.
//   4) (optionally) To support older browsers you need add the intl-relativetimeformat npm packages
//      and take it into use in `util/polyfills.js`

// Note that there is also translations in './translations/countryCodes.js' file
// This file contains ISO 3166-1 alpha-2 country codes, country names and their translations in our default languages
// This used to collect billing address in StripePaymentAddress on CheckoutPage

// Step 2:
// If you are using a non-english locale with moment library,
// you should also import time specific formatting rules for that locale
// There are 2 ways to do it:
// - you can add your preferred locale to MomentLocaleLoader or
// - stop using MomentLocaleLoader component and directly import the locale here.
// E.g. for French:
// import 'moment/locale/fr';
// const hardCodedLocale = process.env.NODE_ENV === 'test' ? 'en' : 'fr';

// Step 3:
// The "./translations/en.json" has generic English translations
// that should work as a default translation if some translation keys are missing
// from the hosted translation.json (which can be edited in Console). The other files
// (e.g. en.json) in that directory has Biketribe themed translations.
//
// If you are using a non-english locale, point `messagesInLocale` to correct <lang>.json file.
// That way the priority order would be:
//   1. hosted translation.json
//   2. <lang>.json
//   3. en.json
//
// I.e. remove "const messagesInLocale" and add import for the correct locale:
// import messagesInLocale from './translations/fr.json';
const messagesInLocale = {};

// If translation key is missing from `messagesInLocale` (e.g. fr.json),
// corresponding key will be added to messages from `defaultMessages` (en.json)
// to prevent missing translation key errors.
const addMissingTranslations = (sourceLangTranslations, targetLangTranslations) => {
  const sourceKeys = Object.keys(sourceLangTranslations);
  const targetKeys = Object.keys(targetLangTranslations);

  // if there's no translations defined for target language, return source translations
  if (targetKeys.length === 0) {
    return sourceLangTranslations;
  }
  const missingKeys = difference(sourceKeys, targetKeys);

  const addMissingTranslation = (translations, missingKey) => ({
    ...translations,
    [missingKey]: sourceLangTranslations[missingKey],
  });

  return missingKeys.reduce(addMissingTranslation, targetLangTranslations);
};

// Get default messages for a given locale.
const isTestEnv = process.env.NODE_ENV === 'test';
const localeMessages = isTestEnv
  ? mapValues(defaultMessages, (val, key) => key)
  : addMissingTranslations(defaultMessages, messagesInLocale);

// For customized apps, this dynamic loading of locale files is not necessary.
// It helps locale change from configDefault.js file or hosted configs, but customizers should probably
// just remove this and directly import the necessary locale on step 2.
const MomentLocaleLoader = props => {
  const { children, locale } = props;
  const isAlreadyImportedLocale =
    typeof hardCodedLocale !== 'undefined' && locale === hardCodedLocale;

  // Moment's built-in locale does not need loader
  const NoLoader = props => <>{props.children()}</>;

  // The default locale is en (en-US). Here we dynamically load one of the other common locales.
  // However, the default is to include all supported locales package from moment library.
  const MomentLocale =
    ['en', 'en-US'].includes(locale) || isAlreadyImportedLocale
      ? NoLoader
      : ['fr', 'fr-FR'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "fr" */ 'moment/locale/fr'))
      : ['de', 'de-DE'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "de" */ 'moment/locale/de'))
      : ['es', 'es-ES'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "es" */ 'moment/locale/es'))
      : ['fi', 'fi-FI'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "fi" */ 'moment/locale/fi'))
      : ['nl', 'nl-NL'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "nl" */ 'moment/locale/nl'))
      : loadable.lib(() => import(/* webpackChunkName: "locales" */ 'moment/min/locales.min'));

  return (
    <MomentLocale>
      {() => {
        // Set the Moment locale globally
        // See: http://momentjs.com/docs/#/i18n/changing-locale/
        moment.locale(locale);
        return children;
      }}
    </MomentLocale>
  );
};

const Configurations = props => {
  const { appConfig, children } = props;
  const routeConfig = routeConfiguration(appConfig.layout, appConfig?.accessControl);
  const locale = isTestEnv ? 'en' : appConfig.localization.locale;

  return (
    <ConfigurationProvider value={appConfig}>
      <MomentLocaleLoader locale={locale}>
        <RouteConfigurationProvider value={routeConfig}>{children}</RouteConfigurationProvider>
      </MomentLocaleLoader>
    </ConfigurationProvider>
  );
};

// IntlProvider that updates based on the current locale from LocaleContext
const LocaleAwareIntlProvider = ({ hostedTranslations, children }) => {
  const { locale, DEFAULT_LOCALE } = useLocale();
  const [messages, setMessages] = useState({});

  useEffect(() => {
    // Load messages for the current locale
    const loadLocaleMessages = async () => {
      try {
        let localeMessages = {};
        
        // Dynamically import the translation file based on locale
        // For all locales including default, we'll load the appropriate file
        if (locale === DEFAULT_LOCALE) {
          // For default locale, we use the messagesInLocale variable
          localeMessages = messagesInLocale;
        } else {
          // For other locales, we dynamically import the JSON file
          const messagesModule = await import(`./translations/${locale}.json`);
          localeMessages = messagesModule.default || messagesModule;
        }
        
        // Add missing translations from default messages
        // Note: hostedTranslations only supports English, so we only use them for the default locale
        const finalMessages = addMissingTranslations(defaultMessages, {
          ...localeMessages,
          ...(locale === DEFAULT_LOCALE ? hostedTranslations : {}),
        });
        
        setMessages(finalMessages);
      } catch (error) {
        console.warn(`Failed to load messages for locale "${locale}", falling back to English`);
        const finalMessages = addMissingTranslations(defaultMessages, {
          ...messagesInLocale,
          ...(locale === DEFAULT_LOCALE ? hostedTranslations : {}),
        });
        setMessages(finalMessages);
      }
    };

    loadLocaleMessages();
  }, [locale, hostedTranslations, DEFAULT_LOCALE]);

  // Adding a key prop that changes with the locale will force the IntlProvider
  // and all its children to remount when the locale changes, ensuring that
  // all FormattedMessage components get the new translations
  return (
    <IntlProvider
      key={locale} // This is the key addition - it forces remounting when locale changes
      locale={locale}
      messages={messages}
      textComponent="span"
    >
      {children}
    </IntlProvider>
  );
};

const MaintenanceModeError = props => {
  const { locale, messages, helmetContext } = props;
  return (
    <IntlProvider locale={locale} messages={messages} textComponent="span">
      <HelmetProvider context={helmetContext}>
        <MaintenanceMode />
      </HelmetProvider>
    </IntlProvider>
  );
};

// This displays a warning if environment variable key contains a string "SECRET"
const EnvironmentVariableWarning = props => {
  const suspiciousEnvKey = props.suspiciousEnvKey;
  // https://github.com/sharetribe/flex-integration-api-examples#warning-usage-with-your-web-app--website
  const containsINTEG = str => str.toUpperCase().includes('INTEG');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <div style={{ width: '600px' }}>
        <p>
          Are you sure you want to reveal to the public web an environment variable called:{' '}
          <b>{suspiciousEnvKey}</b>
        </p>
        <p>
          All the environment variables that start with <i>REACT_APP_</i> prefix will be part of the
          published React app that's running on a browser. Those variables are, therefore, visible
          to anyone on the web. Secrets should only be used on a secure environment like the server.
        </p>
        {containsINTEG(suspiciousEnvKey) ? (
          <p>
            {'Note: '}
            <span style={{ color: 'red' }}>
              Do not use Integration API directly from the web app.
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export const ClientApp = props => {
  const { store, hostedTranslations = {}, hostedConfig = {} } = props;
  const appConfig = mergeConfig(hostedConfig, defaultConfig);

  // Show warning on the localhost:3000, if the environment variable key contains "SECRET"
  if (appSettings.dev) {
    const envVars = process.env || {};
    const envVarKeys = Object.keys(envVars);
    const containsSECRET = str => str.toUpperCase().includes('SECRET');
    const suspiciousSECRETKey = envVarKeys.find(
      key => key.startsWith('REACT_APP_') && containsSECRET(key)
    );

    if (suspiciousSECRETKey) {
      return <EnvironmentVariableWarning suspiciousEnvKey={suspiciousSECRETKey} />;
    }
  }

  // Show MaintenanceMode if the mandatory configurations are not available
  if (!appConfig.hasMandatoryConfigurations) {
    return (
      <MaintenanceModeError
        locale={appConfig.localization.locale}
        messages={{ ...localeMessages, ...hostedTranslations }}
      />
    );
  }

  // Marketplace color and the color for <PrimaryButton> come from configs
  // If set, we need to create CSS Property and set it to DOM (documentElement is selected here)
  // This provides marketplace color for everything under <html> tag (including modals/portals)
  // Note: This is also set on Page component to provide server-side rendering.
  const elem = window.document.documentElement;
  includeCSSProperties(appConfig.branding, elem);

  // This gives good input for debugging issues on live environments, but with test it's not needed.
  const logLoadDataCalls = appSettings?.env !== 'test';

  return (
    <LocaleProvider>
      <Configurations appConfig={appConfig}>
        <LocaleAwareIntlProvider appConfig={appConfig} hostedTranslations={hostedTranslations}>
          <Provider store={store}>
            <HelmetProvider>
              <IncludeScripts config={appConfig} />
              <LocaleBrowserRouter>
                <Routes logLoadDataCalls={logLoadDataCalls} />
                <CookieConsent />
              </LocaleBrowserRouter>
            </HelmetProvider>
          </Provider>
        </LocaleAwareIntlProvider>
      </Configurations>
    </LocaleProvider>
  );
};

ClientApp.propTypes = { store: any.isRequired };

export const ServerApp = props => {
  const { url, context, helmetContext, store, hostedTranslations = {}, hostedConfig = {} } = props;
  const appConfig = mergeConfig(hostedConfig, defaultConfig);
  HelmetProvider.canUseDOM = false;

  // Show MaintenanceMode if the mandatory configurations are not available
  if (!appConfig.hasMandatoryConfigurations) {
    return (
      <MaintenanceModeError
        locale={appConfig.localization.locale}
        messages={{ ...localeMessages, ...hostedTranslations }}
        helmetContext={helmetContext}
      />
    );
  }

  return (
    <LocaleProvider>
      <Configurations appConfig={appConfig}>
        <LocaleAwareIntlProvider appConfig={appConfig} hostedTranslations={hostedTranslations}>
          <Provider store={store}>
            <HelmetProvider context={helmetContext}>
              <IncludeScripts config={appConfig} />
              <LocaleStaticRouter location={url} context={context}>
                <Routes />
              </LocaleStaticRouter>
            </HelmetProvider>
          </Provider>
        </LocaleAwareIntlProvider>
      </Configurations>
    </LocaleProvider>
  );
};

ServerApp.propTypes = { url: string.isRequired, context: any.isRequired, store: any.isRequired };

/**
 * Render the given route.
 *
 * @param {String} url Path to render
 * @param {Object} serverContext Server rendering context from react-router
 *
 * @returns {Object} Object with keys:
 *  - {String} body: Rendered application body of the given route
 *  - {Object} head: Application head metadata from react-helmet
 */
export const renderApp = (
  url,
  serverContext,
  preloadedState,
  hostedTranslations,
  hostedConfig,
  collectChunks
) => {
  // Don't pass an SDK instance since we're only rendering the
  // component tree with the preloaded store state and components
  // shouldn't do any SDK calls in the (server) rendering lifecycle.
  const store = configureStore(preloadedState);

  const helmetContext = {};

  // When rendering the app on server, we wrap the app with webExtractor.collectChunks
  // This is needed to figure out correct chunks/scripts to be included to server-rendered page.
  // https://loadable-components.com/docs/server-side-rendering/#3-setup-chunkextractor-server-side
  const WithChunks = collectChunks(
    <ServerApp
      url={url}
      context={serverContext}
      helmetContext={helmetContext}
      store={store}
      hostedTranslations={hostedTranslations}
      hostedConfig={hostedConfig}
    />
  );

  // Let's keep react-dom/server out of the main code-chunk.
  return import('react-dom/server').then(mod => {
    const { default: ReactDOMServer } = mod;
    const body = ReactDOMServer.renderToString(WithChunks);
    const { helmet: head } = helmetContext;
    return { head, body };
  });
};
