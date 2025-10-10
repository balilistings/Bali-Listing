import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useParams, Link } from 'react-router-dom';

import NotFoundPage from '../NotFoundPage/NotFoundPage.js';
import TopbarContainer from '../TopbarContainer/TopbarContainer.js';
import FooterContainer from '../FooterContainer/FooterContainer.js';
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage.js';
import { IconDate, Page, LayoutSingleColumn } from '../../components/index.js';
import { useConfiguration } from '../../context/configurationContext';
import { extractPageMetadata } from '../../util/seo';

import css from './BlogListPage.module.css';
import { ReactComponent as Spiral } from '../../assets/about-us-spiral.svg';
import { ReactComponent as UserIcon } from '../../assets/usericon.svg';
import CTABlock from '../../components/CTABlock/CTABlock';

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

  const description = text
    .replace(dateRegex, '')
    .replace(/######/g, '')
    .trim();

  return { date, description };
};

const BlogCard = ({ block }) => {
  const { date, description } = getInfoFromText(block.text?.content || '');
  const image = block.media?.image;
  const imageVariants = image ? Object.keys(image.attributes?.variants || {}) : [];

  const href = block.callToAction?.href.replace('/p', '/blog') || '#';

  return (
    <Link to={href} className={css.card}>
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
          {/* <div className={css.category}></div> */}
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

const BlogListPage = props => {
  const params = useParams();
  const pageId = params.pageId || 'blog';
  const config = useConfiguration();

  const { pageAssetsData, inProgress, error } = useSelector(
    state => state.hostedAssets || {},
    shallowEqual
  );

  // const [activeTab, setActiveTab] = useState('All');

  if (inProgress) {
    return <div className={css.root} />;
  }

  if (error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const pageData = pageAssetsData?.[pageId]?.data;
  const blocks = pageData?.sections?.[0]?.blocks || [];

  // Extract meta information using the helper function
  const { title, description, schema, socialSharing } = extractPageMetadata(pageData, 'WebPage');

  // TODO: Add tags for blog posts
  // const tabs = ['All', 'Tips & tricks'];

  return (
    <Page {...{ title, description, schema, socialSharing }} config={config} className={css.root}>
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.hero}>
          <Spiral className={css.spiral} />
          <h1 className={css.heroTitle}>Blog</h1>
        </div>
        <div className={css.content}>
          {/* <div className={css.tabs}>
            {tabs.map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? css.activeTab : css.tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div> */}
          <div className={css.grid}>
            {blocks.map((block, i) => (
              <BlogCard key={i} block={block} />
            ))}
          </div>
        </div>
        <CTABlock />
      </LayoutSingleColumn>
    </Page>
  );
};

export default BlogListPage;
