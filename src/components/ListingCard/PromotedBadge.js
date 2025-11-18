import IconPromoted from '../IconPromoted/IconPromoted';
import css from './PromotedBadge.module.css';

const PromotedBadge = () => {
  return (
    <div className={css.promotedBadge}>
      <div className={css.iconWrapper}>
        <IconPromoted />
      </div>
      <span className={css.promotedText}>Sponsored</span>
    </div>
  );
};

export default PromotedBadge;