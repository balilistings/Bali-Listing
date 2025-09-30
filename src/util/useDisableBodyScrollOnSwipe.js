import { useState, useEffect } from 'react';

const useDisableBodyScrollOnSwipe = () => {
  const [sliderDOMNode, setSliderDOMNode] = useState(null);

  useEffect(() => {
    if (!sliderDOMNode) {
      return;
    }

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = e => {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      if (deltaX > deltaY) {
        document.body.style.overflow = 'hidden';
      }
    };

    const handleTouchEnd = () => {
      document.body.style.overflow = 'auto';
    };

    sliderDOMNode.addEventListener('touchstart', handleTouchStart);
    sliderDOMNode.addEventListener('touchmove', handleTouchMove);
    sliderDOMNode.addEventListener('touchend', handleTouchEnd);
    sliderDOMNode.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      sliderDOMNode.removeEventListener('touchstart', handleTouchStart);
      sliderDOMNode.removeEventListener('touchmove', handleTouchMove);
      sliderDOMNode.removeEventListener('touchend', handleTouchEnd);
      sliderDOMNode.removeEventListener('touchcancel', handleTouchEnd);
      document.body.style.overflow = 'auto';
    };
  }, [sliderDOMNode]);

  return setSliderDOMNode;
};

export default useDisableBodyScrollOnSwipe;