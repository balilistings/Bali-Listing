import React, { useState, useEffect } from 'react';
import { any, string } from 'prop-types';

import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import loadable from '@loadable/component';
import difference from 'lodash/difference';
import mapValues from 'lodash/mapValues';

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
// If you are using time-based functionality, you may need to configure date/time formatting
// This application now uses dayjs instead of moment for date handling.
// E.g. for time zone specific handling you can configure those settings in the date utilities.

// Step 3:
// The "./translations/en.json" has generic English translations
// that should work as a default translation if some translation keys are missing
// from the hosted translation.json (which can be edited in Console).

// If translation key is missing from a locale's messages,
// corresponding key will be added from `defaultMessages` (en.json)
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

const isTestEnv = process.env.NODE_ENV === 'test';



const Configurations = props => {
  const { appConfig, children } = props;
  const routeConfig = routeConfiguration(appConfig.layout, appConfig?.accessControl);
  const locale = isTestEnv ? 'en' : appConfig.localization.locale;

  return (
    <ConfigurationProvider value={appConfig}>
      <RouteConfigurationProvider value={routeConfig}>{children}</RouteConfigurationProvider>
    </ConfigurationProvider>
  );
};

const LocaleAwareIntlProvider = ({ hostedTranslations, children }) => {
  const { locale, messages, DEFAULT_LOCALE } = useLocale();

  const localeMessages = isTestEnv
    ? mapValues(defaultMessages, (val, key) => key)
    : messages;

  const finalMessages = addMissingTranslations(defaultMessages, {
    ...localeMessages,
    ...(locale === DEFAULT_LOCALE ? hostedTranslations : {}),
  });

  return (
    <IntlProvider
      locale={locale}
      messages={finalMessages}
      textComponent="span"
    >
      {children}
    </IntlProvider>
  );
};

const MaintenanceModeError = props => {
  const { locale, helmetContext, hostedTranslations = {} } = props;

  const localeMessages = isTestEnv
    ? mapValues(defaultMessages, (val, key) => key)
    : defaultMessages;

  const finalMessages = addMissingTranslations(defaultMessages, {
    ...localeMessages,
    ...hostedTranslations,
  });

  return (
    <IntlProvider locale={locale} messages={finalMessages} textComponent="span">
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
        messages={{ ...hostedTranslations }}
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
        messages={{ ...hostedTranslations }}
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
