import React, { useState } from 'react';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';
import IconCollection from '../../components/IconCollection/IconCollection';
import { useHistory } from 'react-router-dom';
import ShareModal from '../../components/ShareModal/ShareModal';

const SectionGallery = props => {
  const { listing, variantPrefix, onToggleFavorites, currentUser } = props;
  const isFavorite = currentUser?.attributes.profile.privateData.favorites?.includes(
    listing.id.uuid
  );
  const [showShareModal, setShowShareModal] = useState(false);
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
        <div className={css.rightButtons}>
          <button onClick={() => setShowShareModal(true)}>
            <IconCollection name="share" />
          </button>
          <button className={css.wishlistButton} onClick={toggleFavorites}>
            <IconCollection name={isFavorite ? 'icon-waislist-active' : 'icon-waislist'} />
          </button>
        </div>
      </div>
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
      {showShareModal && <ShareModal setShow={setShowShareModal} />}
    </section>
  );
};

export default SectionGallery;
