import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { pathByRouteName } from '../../util/routes';

// Keep links and carousel/favourite buttons as siblings, never nested links.
// The title remains a native link for keyboard and modified-click navigation.
const CardContainer = ({ id, slug, children, ...props }) => {
  const history = useHistory();
  const routes = useRouteConfiguration();
  const onClick = event => {
    if (event.defaultPrevented || event.target.closest('a, button, input, select, textarea')) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    history.push(pathByRouteName('ListingPage', routes, { id, slug }));
  };
  return <article {...props} onClick={onClick}>{children}</article>;
};
export default CardContainer;
