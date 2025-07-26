import React from 'react';
import styles from './TestmonialSlider.module.css';

const testimonials = [
  {
    text:
      "Thanks, Bali Listings! Finally, someone has implemented a modern idea to help us market our properties. I recommend it, and I believe it's very necessary for the Bali market.",
    name: 'Mirah',
    title: 'Agency',
    avatar:
      'https://sharetribe.imgix.net/67a98290-7785-4d51-a13e-9ff34051f0d5/682d7c49-a202-4afe-9078-5ddfeb3b574e?auto=format&crop=edges&fit=crop&h=120&w=120&s=67ae706751f85828c29e2de7632ed5f6',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'Thanks to this team, we can now enjoy a proper and consistent marketplace, just like anywhere else. They make our lives significantly easier and more productive. Thanks, Bali Listings! I highly recommend their services.',
    name: 'KLS',
    title: 'Agency',
    avatar:
      'https://sharetribe.imgix.net/67a98290-7785-4d51-a13e-9ff34051f0d5/682d7ebb-5e5e-488c-b894-5ac9fadaae6a?auto=format&crop=edges&fit=crop&h=120&w=120&s=42c58b88f10ae19e3f44be3d9a4c5737',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'The platform is super easy to use with quick filters, this was missing in Bali.  Best of all, it’s free of cost with no commissions, saving us money while reaching more buyers.',
    name: 'Rezy Balitecture',
    title: 'Agency',
    avatar:
      'https://sharetribe.imgix.net/67a98290-7785-4d51-a13e-9ff34051f0d5/683fce23-ac06-4459-a7dc-f7e87b5c4362?auto=format&crop=edges&fit=crop&h=120&w=120&s=0c4261849d8766940c9338d658c5a2d5',
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  // ...add more testimonials as needed
];

const testimonials2 = [
  {
    text:
      'I found a long-term rental within two days. The platform is clean, fast, and actually shows what’s available.',
    name: 'Sarah L',
    title: 'Customer',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'Found my dream villa within a few days. The filters made everything so easy, and I avoided wasting time on Facebook.',
    name: 'Thomas R',
    title: 'Customer',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'Finally a site that doesn’t send you in circles. I loved the Whatsapp integration. Got instant replies.',
    name: 'Ayu W',
    title: 'Customer',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'We used it to scout for land while still abroad. Great filters, accurate listings, and no agent drama.',
    name: 'Ben & Carla',
    title: 'Customer',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'Uploading my villa was simple. I got leads fast without paying commission. Will keep using this for sure.',
    name: 'I Made Suta',
    title: 'Owner',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  {
    text:
      'I found a long-term rental within two days. The platform is clean, fast, and actually shows what’s available.',
    name: 'Sarah L',
    title: 'Customer',
    avatar: null,
    linkedin: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg',
  },
  // ...add more testimonials as needed
];

const duplicateTestimonials = [...testimonials, ...testimonials];

const TestmonialSlider = () => {
  return (
    <div className={styles.sliderContainer}>
      <div className={styles.scrollContainer}>
        <div className={styles.scrollContent}>
          {duplicateTestimonials.map((t, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.testimonialText}>"{t.text}"</div>
              <div className={styles.profile}>
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} className={styles.avatar} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    <svg
                      width="22"
                      height="24"
                      viewBox="0 0 22 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.3278 24C20.9247 24 22.6262 21.2719 21.4731 18.9469C18.6841 13.3079 11.8497 11.0016 6.21062 13.7907C3.97469 14.8969 2.16062 16.711 1.05437 18.9469C-0.0987514 21.2719 1.6075 24 4.20437 24H18.3278Z"
                        fill="#C4C4C4"
                      />
                      <path
                        d="M11.2656 10.5469C14.1781 10.5469 16.5391 8.18588 16.5391 5.27344C16.5391 2.361 14.1781 0 11.2656 0C8.35319 0 5.99219 2.361 5.99219 5.27344C5.99219 8.18588 8.35319 10.5469 11.2656 10.5469Z"
                        fill="#C4C4C4"
                      />
                    </svg>
                  </span>
                )}
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
          {testimonials2.map((t, idx) => (
            <div key={`reverse-${idx}`} className={styles.card}>
              <div className={styles.testimonialText}>"{t.text}"</div>
              <div className={styles.profileContainer}>
                <div className={styles.profile}>
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className={styles.avatar} />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      <svg
                        width="22"
                        height="24"
                        viewBox="0 0 22 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18.3278 24C20.9247 24 22.6262 21.2719 21.4731 18.9469C18.6841 13.3079 11.8497 11.0016 6.21062 13.7907C3.97469 14.8969 2.16062 16.711 1.05437 18.9469C-0.0987514 21.2719 1.6075 24 4.20437 24H18.3278Z"
                          fill="#C4C4C4"
                        />
                        <path
                          d="M11.2656 10.5469C14.1781 10.5469 16.5391 8.18588 16.5391 5.27344C16.5391 2.361 14.1781 0 11.2656 0C8.35319 0 5.99219 2.361 5.99219 5.27344C5.99219 8.18588 8.35319 10.5469 11.2656 10.5469Z"
                          fill="#C4C4C4"
                        />
                      </svg>
                    </span>
                  )}
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
