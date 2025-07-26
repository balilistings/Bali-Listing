// src/contexts/CheckboxContext.js

import React, { createContext, useContext, useState } from 'react';

const CheckboxContext = createContext();

export const CheckboxProvider = ({ children }) => {
  const [checkboxState, setCheckboxState] = useState({
    weekly: false,
    monthly: false,
    yearly: false,
  });

  const updateCheckbox = (key, value) => {
    setCheckboxState(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <CheckboxContext.Provider value={{ checkboxState, updateCheckbox }}>
      {children}
    </CheckboxContext.Provider>
  );
};

export const useCheckboxContext = () => useContext(CheckboxContext);
