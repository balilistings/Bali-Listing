import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useParams, Link } from 'react-router-dom';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer.js';
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage';
import { IconBannedUser, IconDate, IconReviewUser } from '../../components';
import { loadData } from './BlogPage.duck';

import css from './BlogPage.module.css';
import { ReactComponent as Spiral } from '../../assets/about-us-spiral.svg';
import { ReactComponent as UserIcon } from '../../assets/usericon.svg';

const getInfoFromText = text => {
  const dateRegex = /\*(\d{2}\/\d{2}\/\d{2})\*/;
  const dateMatch = text.match(dateRegex);
  let date = dateMatch ? dateMatch[1] : '';

  if (date) {
    const [month, day, year] = date.split('/'); // Assuming MM/DD/YY
    const dateObj = new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day));
    const dayOfMonth = dateObj.getDate();
    const monthName = dateObj.toLocaleString('default', { month: 'short' });
    const fullYear = dateObj.getFullYear();
    date = `${dayOfMonth} ${monthName}, ${fullYear}`;
  }

  const description = text.replace(dateRegex, '').replace(/######/g, '').trim();

  return { date, description };
};

const BlogCard = ({ block }) => {
  const { date, description } = getInfoFromText(block.text?.content || '');
  const image = block.media?.image;
  const imageVariants = image ? Object.keys(image.attributes?.variants || {}) : [];

  return (
    <Link to={block.callToAction?.href || '#'} className={css.card}>
      {image && (
        <ResponsiveImage
          alt={block.media?.alt || block.title?.content}
          image={image}
          variants={imageVariants}
          className={css.cardImage}
        />
      )}
      <div className={css.cardContent}>
        <div className={css.topMeta}>
          <div className={css.category}>Tips & tricks</div>
          <div className={css.meta}>
            <div className={css.author}>
              <UserIcon />
              <span>Wesley Silalahi</span>
            </div>
            <div className={css.date}>
              <IconDate />
              <span>{date}</span>
            </div>
          </div>
        </div>
        <h2 className={css.title}>{block.title?.content}</h2>
        <p className={css.description}>{description}</p>
      </div>
    </Link>
  );
};

const BlogPage = props => {
  const dispatch = useDispatch();
  const params = useParams();
  const pageId = 'blog';

  const { pageAssetsData, inProgress, error } = useSelector(
    state => state.hostedAssets || {},
    shallowEqual
  );

  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (inProgress || pageAssetsData?.[pageId]) {
      return;
    }
    dispatch(loadData(params));
  }, [dispatch, params, pageId, inProgress, pageAssetsData]);

  if (inProgress) {
    return <div className={css.root} />;
  }

  if (error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const pageData = pageAssetsData?.[pageId]?.data;
  const blocks = pageData?.sections?.[0]?.blocks || [];

  const tabs = ['All', 'Tips & tricks', 'Lorem', 'Lorem', 'Lorem'];

  return (
    <div className={css.root}>
      <TopbarContainer />
      <div className={css.hero}>
        <Spiral className={css.spiral} />
        <h1 className={css.heroTitle}>Blog</h1>
      </div>
      <div className={css.content}>
        <div className={css.tabs}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? css.activeTab : css.tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={css.grid}>
          {blocks.map((block, i) => (
            <BlogCard key={i} block={block} />
          ))}
        </div>
      </div>
      <FooterContainer />
    </div>
  );
};

export default BlogPage;
