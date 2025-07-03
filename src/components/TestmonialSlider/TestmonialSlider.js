import React from 'react';
import styles from './TestmonialSlider.module.css';

const testimonials = [
  {
    text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    name: 'Name Text',
    title: 'Title',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's.",
    name: 'Name Text',
    title: 'Title',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    name: 'Name Text',
    title: 'Title',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  // ...add more testimonials as needed
];
{
  /* Duplicate for seamless loop */
}
const duplicateTestimonials = [...testimonials, ...testimonials];

const TestmonialSlider = () => {
  return (
    <div className={styles.sliderContainer}>
      <div className={styles.scrollContainer}>
        <div className={styles.scrollContent}>
          {duplicateTestimonials.map((t, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.testimonialText}>{t.text}</div>
              <div className={styles.profile}>
                <img src={t.avatar} alt={t.name} className={styles.avatar} />
                <div>
                  <p className={styles.name}>{t.name}</p>
                  <p className={styles.title}>{t.title}</p>
                </div>
              </div>
              {/* <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.linkedin}
              >
                <path
                  d="M19.7721 0.434082H2.13574C1.17206 0.434082 0.330078 1.12748 0.330078 2.07984V19.7553C0.330078 20.7129 1.17206 21.5662 2.13574 21.5662H19.7669C20.7357 21.5662 21.4622 20.7072 21.4622 19.7553V2.07984C21.4678 1.12748 20.7357 0.434082 19.7721 0.434082ZM6.88055 18.0487H3.85319V8.63597H6.88055V18.0487ZM5.47159 7.20484H5.44989C4.48102 7.20484 3.85366 6.48361 3.85366 5.58078C3.85366 4.66144 4.49753 3.9572 5.4881 3.9572C6.47866 3.9572 7.0848 4.65625 7.10649 5.58078C7.10602 6.48361 6.47866 7.20484 5.47159 7.20484ZM17.9447 18.0487H14.9173V12.902C14.9173 11.669 14.4768 10.8265 13.3815 10.8265C12.5447 10.8265 12.0494 11.3926 11.8291 11.944C11.7466 12.1421 11.7244 12.4119 11.7244 12.6874V18.0487H8.69706V8.63597H11.7244V9.94587C12.165 9.31852 12.8532 8.41569 14.4546 8.41569C16.4419 8.41569 17.9452 9.72559 17.9452 12.5496L17.9447 18.0487Z"
                  fill="#CCCCCC"
                />
              </svg> */}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.scrollContainer}>
        <div className={`${styles.scrollContent} ${styles.reverse}`}>
          {duplicateTestimonials.map((t, idx) => (
            <div key={`reverse-${idx}`} className={styles.card}>
              <div className={styles.testimonialText}>"{t.text}"</div>
              <div className={styles.profileContainer}>
                <div className={styles.profile}>
                  <img src={t.avatar} alt={t.name} className={styles.avatar} />
                  <div>
                    <p className={styles.name}>{t.name}</p>
                    <p className={styles.title}>{t.title}</p>
                  </div>
                </div>
                {/* <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.7721 0.434082H2.13574C1.17206 0.434082 0.330078 1.12748 0.330078 2.07984V19.7553C0.330078 20.7129 1.17206 21.5662 2.13574 21.5662H19.7669C20.7357 21.5662 21.4622 20.7072 21.4622 19.7553V2.07984C21.4678 1.12748 20.7357 0.434082 19.7721 0.434082ZM6.88055 18.0487H3.85319V8.63597H6.88055V18.0487ZM5.47159 7.20484H5.44989C4.48102 7.20484 3.85366 6.48361 3.85366 5.58078C3.85366 4.66144 4.49753 3.9572 5.4881 3.9572C6.47866 3.9572 7.0848 4.65625 7.10649 5.58078C7.10602 6.48361 6.47866 7.20484 5.47159 7.20484ZM17.9447 18.0487H14.9173V12.902C14.9173 11.669 14.4768 10.8265 13.3815 10.8265C12.5447 10.8265 12.0494 11.3926 11.8291 11.944C11.7466 12.1421 11.7244 12.4119 11.7244 12.6874V18.0487H8.69706V8.63597H11.7244V9.94587C12.165 9.31852 12.8532 8.41569 14.4546 8.41569C16.4419 8.41569 17.9452 9.72559 17.9452 12.5496L17.9447 18.0487Z"
                    fill="#CCCCCC"
                  />
                </svg> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestmonialSlider;
