import React from 'react';
import css from './Login.module.css';
import Loginleft from '../../../assets/LoginLeft.png';
import { FacebookLogo, GoogleLogo } from '../socialLoginLogos';
import eyeIcon from '../../../assets/icons/EyeIcon.svg';

const LoginPage = () => {
  return (
    <div className={css.loginContainer}>
      {/* Left side with image and logo */}
      <div className={css.leftPanel}>
        <img src={Loginleft} alt="Bali Listings" className={css.mainImage} />
      </div>

      {/* Right side with form */}
      <div className={css.rightPanel}>
        <h2 className={css.loginTitle}>Login</h2>
        <p className={css.loginSubtext}>
          Whether you're listing or looking, Log in to manage it all.
        </p>

        <form className={css.loginForm}>
          <label>Email Address</label>
          <input type="email" placeholder="you@gmail.com" required />

          <label>Password</label>
          <div className={css.passwordField}>
            <input type="password" placeholder="********" required />
          </div>

          <div className={css.forgotPassword}>
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" className={css.loginButton}>
            Login
          </button>
        </form>

        <div className={css.divider}>
          <hr className={css.line} />
          <span className={css.textSignup}>Or Login With</span>
          <hr className={css.line} />
        </div>

        <div className={css.socialButtons}>
          <button className={css.socialButton}>{GoogleLogo} Google</button>
          <button className={css.socialButton}>{FacebookLogo} Facebook</button>
        </div>

        <p className={css.signupLink}>
          Don’t have an account? <a href="#">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
