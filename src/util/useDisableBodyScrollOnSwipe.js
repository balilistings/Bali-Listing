import { useState, useEffect } from 'react';

const useDisableBodyScrollOnSwipe = () => {
  const [sliderDOMNode, setSliderDOMNode] = useState(null);

  useEffect(() => {
    if (!sliderDOMNode) {
      return;
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalScroll = false;

    // Check if the device is iOS
    const isIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      );
    };

    const preventVerticalScroll = e => {
      if (isHorizontalScroll) {
        e.preventDefault();
      }
    };

    const handleTouchStart = e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalScroll = false;
    };

    const handleTouchMove = e => {
      if (!touchStartX || !touchStartY) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      
      const deltaX = Math.abs(touchCurrentX - touchStartX);
      const deltaY = Math.abs(touchCurrentY - touchStartY);

      // Determine if it's primarily a horizontal swipe
      isHorizontalScroll = deltaX > deltaY;

      if (isHorizontalScroll) {
        // For iOS, we need to prevent the default touchmove behavior
        // to stop vertical scrolling during horizontal swipe
        if (isIOS()) {
          e.preventDefault();
        } else {
          // For other browsers, set overflow to hidden
          document.body.style.overflow = 'hidden';
        }
      }
    };

    const handleTouchEnd = () => {
      // Reset after a slight delay to allow for smooth transition
      setTimeout(() => {
        if (!isHorizontalScroll) {
          document.body.style.overflow = 'auto';
        }
        isHorizontalScroll = false;
      }, 100);
    };

    // For iOS devices, we'll use passive: false to allow preventDefault
    const options = isIOS() ? { passive: false } : { passive: true };
    
    // Add event listeners
    sliderDOMNode.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // For iOS, we need to allow preventDefault on touchmove
    sliderDOMNode.addEventListener('touchmove', handleTouchMove, options);
    
    sliderDOMNode.addEventListener('touchend', handleTouchEnd, { passive: true });
    sliderDOMNode.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Also add a global touchmove listener specifically for iOS 
    // to prevent vertical scrolling when needed
    if (isIOS()) {
      document.addEventListener('touchmove', preventVerticalScroll, options);
    }

    return () => {
      // Clean up event listeners
      sliderDOMNode.removeEventListener('touchstart', handleTouchStart, { passive: true });
      sliderDOMNode.removeEventListener('touchmove', handleTouchMove, options);
      sliderDOMNode.removeEventListener('touchend', handleTouchEnd, { passive: true });
      sliderDOMNode.removeEventListener('touchcancel', handleTouchEnd, { passive: true });

      if (isIOS()) {
        document.removeEventListener('touchmove', preventVerticalScroll, options);
      }

      // Reset body overflow when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, [sliderDOMNode]);

  return setSliderDOMNode;
};

export default useDisableBodyScrollOnSwipe;