import React, { useState } from 'react';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';
import IconCollection from '../../components/IconCollection/IconCollection';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

const SectionGallery = props => {
  const { listing, variantPrefix, onToggleFavorites, currentUser } = props;
  const isFavorite = currentUser?.attributes.profile.privateData.favorites?.includes(
    listing.id.uuid
  );
  const history = useHistory();
  const images = listing.images;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];

  const toggleFavorites = () => onToggleFavorites(isFavorite);

  return (
    <section className={css.productGallery} data-testid="carousel">
      <div className={css.backButtonContainer}>
        <div className={css.backButton} onClick={() => history.goBack()}>
          <IconCollection name="icon-back" />
        </div>
        <button 
          className={classNames(css.wishlistButton, isFavorite ? css.active : '')} 
          onClick={toggleFavorites}>
          <IconCollection name="icon-waislist" />
        </button>
      </div>
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
    </section>
  );
};

export default SectionGallery;
