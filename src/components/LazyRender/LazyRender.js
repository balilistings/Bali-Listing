import PropTypes from 'prop-types';

// Server-rendered content must also be present on the first client render.
// Observer placeholders discarded the existing markup during hydration and
// forced React to rebuild the surrounding page. Images retain native lazy loading.
const LazyRender = ({ children }) => children;

LazyRender.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LazyRender;
