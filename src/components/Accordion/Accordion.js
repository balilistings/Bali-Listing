import React, { useState } from 'react';
import { FaAngleDown } from 'react-icons/fa6';
import css from './Accordion.module.css';

const Accordion = props => {
  const { items } = props;
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={css.root}>
      {items.map((item, index) => (
        <div className={css.item} key={item.key}>
          <div className={css.title} onClick={() => toggle(index)}>
            {item.title}
            <div className={css.icon}>
              <FaAngleDown
                style={{ transform: activeIndex === index ? 'rotate(180deg)' : 'none' }}
              />
            </div>
          </div>
          {activeIndex === index && <div className={css.content}>{item.content}</div>}
        </div>
      ))}
    </div>
  );
};

export default Accordion;
