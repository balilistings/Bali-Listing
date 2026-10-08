import React, { useState } from 'react';
import classNames from 'classnames';
import ReactImageGallery from 'react-image-gallery';

import { propTypes } from '../../../util/types';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import {
  AspectRatioWrapper,
  Button,
  IconClose,
  IconArrowHead,
  ResponsiveImage,
} from '../../../components';

// Copied directly from
// `node_modules/react-image-gallery/styles/css/image-gallery.css`. The
// copied file is left unedited, and all the overrides are defined in
// the component CSS file below.
import './image-gallery.css';

import css from './ListingImageGallery.module.css';
import DeferredGalleryImage from '../DeferredGalleryImage';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  showThumbnails: false,
  showBullets: false,
  disableSwipe: false,
};
const MAX_LANDSCAPE_ASPECT_RATIO = 2; // 2:1
const MAX_PORTRAIT_ASPECT_RATIO = 4 / 3;

const getFirstImageAspectRatio = (firstImage, scaledVariant) => {
  if (!firstImage) {
    return { aspectWidth: 1, aspectHeight: 1 };
  }

  const v = firstImage?.attributes?.variants?.[scaledVariant];
  const w = v?.width;
  const h = v?.height;
  const hasDimensions = !!w && !!h;
  const aspectRatio = w / h;

  // We keep the fractions separated as these are given to AspectRatioWrapper
  // which expects separate width and height
  return hasDimensions && aspectRatio >= MAX_LANDSCAPE_ASPECT_RATIO
    ? { aspectWidth: 2, aspectHeight: 1 }
    : hasDimensions && aspectRatio <= MAX_PORTRAIT_ASPECT_RATIO
    ? { aspectWidth: 4, aspectHeight: 3 }
    : hasDimensions
    ? { aspectWidth: w, aspectHeight: h }
    : { aspectWidth: 1, aspectHeight: 1 };
};

/**
 * The ListingImageGallery component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Array<propTypes.image>} props.images - The images
 * @param {Array<string>} props.imageVariants - The image variants
 * @param {Array<string>} props.thumbnailVariants - The thumbnail variants
 * @returns {JSX.Element} listing image gallery component
 */
const ListingImageGalleryContent = props => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [requestedIndices, setRequestedIndices] = useState([0]);
  const intl = useIntl();
  const { rootClassName, className, images, imageVariants } = props;
  // imageVariants are scaled variants.
  const { aspectWidth, aspectHeight } = getFirstImageAspectRatio(images?.[0], imageVariants[0]);
  
  const items = images.map((img, i) => {
    return {
      // We will only use the image resource, but react-image-gallery
      // requires the `original` key from each item.
      original: '',
      index: i,
      alt: intl.formatMessage(
        { id: 'ListingImageGallery.imageAltText' },
        { index: i + 1, count: images.length }
      ),
      image: img,
    };
  });

  const imageSizesMaybe = isFullscreen
    ? {}
    : { sizes: `(max-width: 1024px) 100vw, (max-width: 1200px) calc(100vw - 192px), 708px` };
  const renderItem = item => {
    return (
      <AspectRatioWrapper
        width={aspectWidth || 1}
        height={aspectHeight || 1}
        className={isFullscreen ? css.itemWrapperFullscreen : css.itemWrapper}
      >
        <div className={css.itemCentering}>
          {requestedIndices.includes(item.index) && <DeferredGalleryImage
            key={item.image.id?.uuid}
            listingId={props.listingId}
            rootClassName={css.item}
            image={item.image}
            alt={item.alt}
            variants={imageVariants}
            {...imageSizesMaybe}
          />}
        </div>
      </AspectRatioWrapper>
    );
  };
  
  const onScreenChange = isFull => {
    setIsFullscreen(isFull);
  };

  const onSlide = index => {
    setCurrentIndex(index);
  };
  const onBeforeSlide = index => {
    setRequestedIndices(previous => previous.includes(index) ? previous : [...previous, index]);
  };

  const renderLeftNav = (onClick, disabled) => {
    return (
      <button type="button" className={css.navLeft} disabled={disabled} onClick={onClick}
        aria-label={intl.formatMessage({ id: 'ListingImageGallery.previousPhoto', defaultMessage: 'Previous photo' })}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="left" size="big" />
        </div>
      </button>
    );
  };
  const renderRightNav = (onClick, disabled) => {
    return (
      <button type="button" className={css.navRight} disabled={disabled} onClick={onClick}
        aria-label={intl.formatMessage({ id: 'ListingImageGallery.nextPhoto', defaultMessage: 'Next photo' })}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="right" size="big" />
        </div>
      </button>
    );
  };
  const renderFullscreenButton = (onClick, isFullscreen) => {
    return isFullscreen ? (
      <Button
        onClick={onClick}
        rootClassName={css.close}
        title={intl.formatMessage({ id: 'ListingImageGallery.closeModalTitle' })}
      >
        <span className={css.closeText}>
          <FormattedMessage id="ListingImageGallery.closeModal" />
        </span>
        <IconClose rootClassName={css.closeIcon} />
      </Button>
    ) : (
      <div className={css.openFullscreenWrapper}>
        <button className={css.openFullscreen} onClick={onClick}>
          <FormattedMessage
            id="ListingImageGallery.viewImagesButton"
          />
        </button>
      </div>
    );
  };

  if (items.length === 0) {
    return <ResponsiveImage className={css.noImage} image={null} variants={[]} alt="" />;
  }

  const classes = classNames(rootClassName || css.root, className);

  return (
    <ReactImageGallery
      additionalClass={classes}
      items={items}
      renderItem={renderItem}
      renderCustomControls={() => (
        <span className={css.photoCounter} role="status" aria-live="polite" aria-atomic="true">
          {currentIndex + 1} / {items.length}
        </span>
      )}
      onScreenChange={onScreenChange}
      renderLeftNav={renderLeftNav}
      renderRightNav={renderRightNav}
      renderFullscreenButton={renderFullscreenButton}
      {...IMAGE_GALLERY_OPTIONS}
      onSlide={onSlide}
      onBeforeSlide={onBeforeSlide}
    />
  );
};

// A different listing starts with its cover, without loading photos selected on the previous one.
const ListingImageGallery = props => {
  const key = props.images.map(image => image.id?.uuid || image.attributes?.variants?.[props.imageVariants[0]]?.url).join(',');
  return <ListingImageGalleryContent key={key} {...props} />;
};

export default ListingImageGallery;
