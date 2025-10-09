import React from 'react';
import { ReactComponent as IconSolutionEagle } from './solution-eagle.svg';

const iconMap = {
  'legal visa bali': IconSolutionEagle,
  'eagle protect': IconSolutionEagle,
  'bali luxe rent': IconSolutionEagle,
  futurify: IconSolutionEagle,
};

const IconSolution = ({ solutionName }) => {
  if (!solutionName) {
    return null;
  }
  const IconComponent = iconMap[solutionName.toLowerCase()];
  return IconComponent ? <IconComponent /> : null;
};

export default IconSolution;