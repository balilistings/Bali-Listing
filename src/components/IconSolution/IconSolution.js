import React from 'react';
import { ReactComponent as IconSolutionEagle } from './solution-eagle.svg';
import { ReactComponent as IconSolutionAsiaPlus } from './solution-aplus.svg';
import { ReactComponent as IconSolutionLib } from './solution-lib.svg';

const iconMap = {
  'legal visa bali': IconSolutionEagle,
  'eagle protect': IconSolutionEagle,
  'bali luxe rent': IconSolutionEagle,
  futurify: IconSolutionEagle,
  'asia plus invest': IconSolutionAsiaPlus,
  'live in bali': IconSolutionLib,
  'lilu rental': IconSolutionEagle,

};

const IconSolution = ({ solutionName }) => {
  if (!solutionName) {
    return null;
  }
  const IconComponent = iconMap[solutionName.toLowerCase()];
  return IconComponent ? <IconComponent /> : null;
};

export default IconSolution;