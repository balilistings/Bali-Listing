import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const isSsr = typeof window === 'undefined';

const LazyRender = props => {
  const { children, placeholderHeight = 200, rootMargin = '400px' } = props;
  const [isVisible, setIsVisible] = useState(isSsr);
  const placeholderRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
      }
    );

    const pRef = placeholderRef.current;
    if (pRef) {
      observer.observe(pRef);
    }

    return () => {
      if (pRef) {
        observer.unobserve(pRef);
      }
    };
  }, [isVisible, rootMargin]);

  return isVisible ? (
    children
  ) : (
    <div ref={placeholderRef} style={{ minHeight: `${placeholderHeight}px` }} />
  );
};

LazyRender.propTypes = {
  children: PropTypes.node.isRequired,
  placeholderHeight: PropTypes.number,
  rootMargin: PropTypes.string,
};

export default LazyRender;
