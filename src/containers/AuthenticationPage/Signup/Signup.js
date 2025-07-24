import React, { useState } from 'react';
import css from './Signup.module.css';
import { Form, Field } from 'react-final-form';
import customerIcon from '../../../assets/icons/CustomerPerson.svg';
import providerIcon from '../../../assets/icons/ProviderPeople.svg';
import backgroundImage from '../../../assets/SignUpLeft.png';
import { FacebookLogo, GoogleLogo } from '../socialLoginLogos';
import { FieldTextInput } from '../../../components';

const Signup = () => {
  const Users = [
    {
      key: 'Customer',
      title: 'Costumer',
      subtitle: 'You are looking to rent or buy a villa, land, or apartment in Bali.',
      icon: customerIcon,
    },
    {
      key: 'Provider',
      title: 'Provider',
      subtitle: 'You are an owner, agent, or developer with property to offer.',
      icon: providerIcon,
    },
  ];
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserClick = key => {
    setSelectedUser(key);
    console.log('key on signup', key);
  };
  const handleSubmit = values => {
    console.log('Form submitted with:', values);
  };

  // const emailRequired = validators.required(
  //   intl.formatMessage({
  //     id: 'SignupForm.emailRequired',
  //   })
  // );
  // const emailValid = validators.emailFormatValid(
  //   intl.formatMessage({
  //     id: 'SignupForm.emailInvalid',
  //   })
  // );

  // const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={css.signupContainer}>
      <img className={css.signupLeft} src={backgroundImage} />

      <div className={css.signupRight}>
        <div className={css.signup}>Sign Up</div>
        <p>
          Create your account and get started. Whether you're looking for a place or offering one.
        </p>
        <div className={css.formContainer}>
          <h4 className={css.sectionTitle}>User Type</h4>

          {selectedUser == null &&
            Users.map(user => (
              <div className={css.wrapper}>
                <label
                  className={`${css.userOption} ${selectedUser === user.key ? css.selected : ''}`}
                  onClick={() => handleUserClick(user.key)}
                >
                  <div className={css.imageWrapper}>
                    <img src={user.icon} alt={user.title} className={css.img} />
                  </div>
                  <div className={css.text}>
                    <strong>{user.title}</strong>
                    <div>
                      <p>{user.subtitle}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          {selectedUser == 'Customer' ? (
            <div className={css.wrapper}>
              <label
                className={`${css.userOption} ${selectedUser === Users[0].key ? css.selected : ''}`}
                onClick={() => handleUserClick(Users[0].key)}
              >
                <div className={css.imageWrapper}>
                  <img src={Users[0].icon} alt={Users[0].title} className={css.img} />
                </div>
                <div className={css.text}>
                  <strong>{Users[0].title}</strong>
                  <div>
                    <p>{Users[0].subtitle}</p>
                  </div>
                </div>
              </label>
            </div>
          ) : selectedUser == 'Provider' ? (
            <div className={css.wrapper}>
              <label
                className={`${css.userOption} ${selectedUser === Users[1].key ? css.selected : ''}`}
                onClick={() => handleUserClick(Users[1].key)}
              >
                <div className={css.imageWrapper}>
                  <img src={Users[1].icon} alt={Users[1].title} className={css.img} />
                </div>
                <div className={css.text}>
                  <strong>{Users[1].title}</strong>
                  <div>
                    <p>{Users[1].subtitle}</p>
                  </div>
                </div>
              </label>
            </div>
          ) : null}
          {selectedUser !== null && (
            <Form
              onSubmit={handleSubmit}
              render={({ handleSubmit }) => (
                <form className={css.form} onSubmit={handleSubmit}>
                  <label className={css.labelForm}>Email</label>
                  <Field name="Email">
                    {({ input }) => <input {...input} type="email" placeholder="your@email.com" />}
                  </Field>
                  <div className={css.nameDevide}>
                    <div>
                      <label className={css.labelForm}>First Name</label>
                      <Field name="First Name">
                        {({ input }) => <input {...input} type="fname" placeholder="ex: Westley" />}
                      </Field>
                    </div>
                    <div>
                      <label className={css.labelForm}>Last Name</label>
                      <Field name="Last Name">
                        {({ input }) => (
                          <input {...input} type="lname" placeholder="ex: Situmorang" />
                        )}
                      </Field>
                    </div>
                  </div>
                  <label className={css.labelForm}>Display Name</label>
                  <Field name="Display Name">
                    {({ input }) => <input {...input} type="dname" placeholder="Display Name" />}
                  </Field>
                  <label className={css.labelForm}>Password</label>
                  <Field name="Password">
                    {({ input }) => <input {...input} type="password" placeholder="Password" />}
                  </Field>
                </form>
              )}
            />
          )}
          <div className={css.terms}>
            <div className={css.checkbox}>
              <input type="checkbox" class={css.customCheckbox} />
            </div>
            <label htmlFor="agree" className={css.termsText}>
              I accept the
              <a href="#" style={{ color: selectedUser === null ? 'gray' : '#FF4FF7' }}>
                Terms of Service
              </a>
              and
              <a href="#" style={{ color: selectedUser === null ? 'gray' : '#FF4FF7' }}>
                Privacy Policy
              </a>
            </label>
          </div>
          <button className={selectedUser === null ? css.signupDisable : css.signupButton}>
            Sign Up
          </button>
        </div>
        {selectedUser == null && (
          <div>
            <div className={css.orSignup}>
              <div className={css.dividerContainer}>
                <hr className={css.line} />
                <span className={css.textSignup}>Or Sign Up With</span>
                <hr className={css.line} />
              </div>
              <div className={css.buttonWrapper}>
                <div className={css.GoogleWrapper}>
                  <button className={css.signupGoogle}>
                    <span>{GoogleLogo} Google</span>
                  </button>
                </div>
                <div className={css.FacebookWrapper}>
                  <button className={css.signupFacebook}>
                    <span>{FacebookLogo} Facebook</span>
                  </button>
                </div>
              </div>
            </div>
            <p>
              Already have an account? <a href="/login">Login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
