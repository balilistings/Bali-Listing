import React, { useState } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink, IconEye } from '../../../components';

import css from './LoginForm.module.css';

const LoginFormComponent = props => {
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FinalForm
      {...props}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          formId,
          handleSubmit,
          inProgress,
          intl,
          invalid,
          values,
          errors,
        } = fieldRenderProps;

        // email
        const emailLabel = intl.formatMessage({
          id: 'LoginForm.emailLabel',
        });
        const emailPlaceholder = intl.formatMessage({
          id: 'LoginForm.emailPlaceholder',
        });
        const emailRequiredMessage = intl.formatMessage({
          id: 'LoginForm.emailRequired',
        });
        const emailRequired = validators.required(emailRequiredMessage);
        const emailInvalidMessage = intl.formatMessage({
          id: 'LoginForm.emailInvalid',
        });
        const emailValid = validators.emailFormatValid(emailInvalidMessage);

        // password
        const passwordLabel = intl.formatMessage({
          id: 'LoginForm.passwordLabel',
        });
        const passwordPlaceholder = intl.formatMessage({
          id: 'LoginForm.passwordPlaceholder',
        });
        const passwordRequiredMessage = intl.formatMessage({
          id: 'LoginForm.passwordRequired',
        });
        const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = invalid || submitInProgress;

        const passwordRecoveryLink = (
          <NamedLink
            name="PasswordRecoveryPage"
            className={css.recoveryLink}
            to={{
              search:
                values?.email && !errors?.email ? `email=${encodeURIComponent(values.email)}` : '',
            }}
          >
            <FormattedMessage id="LoginForm.forgotPassword" />
          </NamedLink>
        );

        // Handle password visibility toggle
        const handlePasswordToggle = () => {
          setShowPassword(!showPassword);
        };

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <div className={css.formTitle}>
              <h2>Login</h2>
              <p>Whether you're listing or looking. Log in to manage it all.</p>
            </div>
            <div className={css.formFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={emailLabel}
                placeholder={emailPlaceholder}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />

              {/* Password field with visibility toggle */}
              <Field name="password" validate={passwordRequired}>
                {fieldRenderProps => {
                  const { input, meta } = fieldRenderProps;
                  const { error, touched } = meta;

                  console.log('meta', meta);
                  return (
                    <div className={css.passwordFieldWrapper}>
                      <label htmlFor={formId ? `${formId}.password` : 'password'}>
                        {passwordLabel}
                      </label>
                      <div className={css.passwordInputWrapper}>
                        <input
                          {...input}
                          className={css.passwordInput}
                          type={showPassword ? 'text' : 'password'}
                          id={formId ? `${formId}.password` : 'password'}
                          autoComplete="current-password"
                          placeholder={passwordPlaceholder}
                        />
                        <button
                          type="button"
                          className={css.passwordToggle}
                          onClick={handlePasswordToggle}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          tabIndex={0}
                        >
                          <IconEye isVisible={showPassword} />
                        </button>
                      </div>
                      {touched && error && <div className={css.error}>{error}</div>}
                    </div>
                  );
                }}
              </Field>

              <p className={css.bottomWrapperText}>
                <span className={css.recoveryLinkInfo}>
                  <FormattedMessage
                    id="LoginForm.forgotPasswordInfo"
                    values={{ passwordRecoveryLink }}
                  />
                </span>
              </p>
            </div>
            <div className={css.bottomWrapper}>
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="LoginForm.logIn" />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

/**
 * A component that renders the login form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @returns {JSX.Element}
 */
const LoginForm = props => {
  const intl = useIntl();
  return <LoginFormComponent {...props} intl={intl} />;
};

export default LoginForm;
