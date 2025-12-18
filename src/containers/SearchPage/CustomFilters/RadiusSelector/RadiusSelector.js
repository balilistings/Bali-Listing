import css from './RadiusSelector.module.css';
import { FormattedMessage } from 'react-intl';

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 25, label: '25 km' },
];

function RadiusSelector({ selectedRadius, onRadiusChange, onReset }) {
  const handleRadiusSelect = radius => {
    onRadiusChange(radius);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>
          <FormattedMessage id="LocationSelector.radius" />
        </h3>
        {selectedRadius && (
          <button onClick={handleReset} className={css.resetButton}>
            <FormattedMessage id="CustomFilters.reset" />
          </button>
        )}
      </div>

      <div className={css.radiusGrid}>
        {RADIUS_OPTIONS.map(option => (
          <button
            type="button"
            key={option.value}
            className={`${css.radiusPill} ${selectedRadius === option.value ? css.selected : ''}`}
            onClick={() => handleRadiusSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RadiusSelector;
