import { isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validates a phone number using libphonenumber-js
 * @param {string} message - Error message to return if validation fails
 * @returns {function} - Validator function
 */
export const phoneNumberValid = message => value => {
  if (!value) {
    return message;
  }
  
  // Check if the value is a valid phone number
  return isValidPhoneNumber(value) ? undefined : message;
};