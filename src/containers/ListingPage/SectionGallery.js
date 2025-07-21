import React, { useState } from 'react';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';
import IconCollection from '../../components/IconCollection/IconCollection';

const SectionGallery = props => {
  const { listing, variantPrefix, currentUser } = props;
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const images = listing.images;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];
  return (
    <section className={css.productGallery} data-testid="carousel">
      <div className={css.backButtonContainer}>
        <div className={css.backButton}>
          <IconCollection name="icon-back" />
        </div>
        <div className={css.wishlistButton} onClick={() => setIsWishlistOpen(!isWishlistOpen)}>
          <IconCollection name={isWishlistOpen ? 'icon-waislist-active' : 'icon-waislist'} />
        </div>
      </div>
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
        currentUser={currentUser}
      />
    </section>
  );
};

export default SectionGallery;
