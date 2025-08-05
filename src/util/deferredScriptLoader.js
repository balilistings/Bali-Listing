// src/util/DeferredScriptLoader.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export const DeferredScriptLoader = ({ scripts,onChangeClientState }) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Load only after entire page is loaded
    const onPageLoad = () => {
      setShouldLoad(true);
    };

    // Check if already loaded
    if (document.readyState === 'complete') {
      onPageLoad();
    } else {
      window.addEventListener('load', onPageLoad);
    }

    return () => window.removeEventListener('load', onPageLoad);
  }, []);

  
  if (!shouldLoad) return null;
  
  return <Helmet onChangeClientState={onChangeClientState}>{scripts}</Helmet>;
};