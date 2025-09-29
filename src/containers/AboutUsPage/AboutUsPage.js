import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import unified from 'unified';
import parse from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeReact from 'rehype-react';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer.js';
import { loadData } from './AboutUsPage.duck';

import css from './AboutUsPage.module.css';

const renderAst = new rehypeReact({ createElement: React.createElement }).Compiler;

const AboutUsPage = props => {
  const dispatch = useDispatch();
  const params = useParams();
  const pageId = 'about';

  const { pageAssetsData, inProgress, error } = useSelector(state => state.hostedAssets || {});

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
  const section = pageData?.sections?.[0];
  const block = section?.blocks?.[0];
  const markdownContent = block?.text?.content || '';

  const processor = unified().use(parse);
  const ast = processor.parse(markdownContent);

  const contentParts = ast.children.reduce((acc, node) => {
    if (node.type === 'heading' && node.depth === 2) {
      const titleNode = node.children[0];
      const title = titleNode ? titleNode.value : '';
      acc.push({ title, content: [] });
    } else if (acc.length > 0) {
      acc[acc.length - 1].content.push(node);
    } else {
      if (!acc[0]) {
        acc.push({ title: 'intro', content: [] });
      }
      acc[0].content.push(node);
    }
    return acc;
  }, []);

  const toReact = contentAst => {
    if (!contentAst || contentAst.length === 0) return null;
    const content = { type: 'root', children: contentAst };
    return renderAst(unified().use(remark2rehype).runSync(content));
  };

  const birthContent = toReact(contentParts.find(p => p.title === 'intro')?.content);
  const missionContent = toReact(contentParts.find(p => p.title === 'Our Mission')?.content);
  const differentContent = toReact(
    contentParts.find(p => p.title === 'What Makes BaliListings Different?')?.content
  );

  const birthTitle = section?.title?.content || 'The Birth of Bali Listings';
  const missionTitle = 'Our mission';
  const differentTitle = 'What Makes Bali Listings Different';

  const missionImage = block?.media?.image?.attributes?.variants?.landscape800?.url;
  const missionImageAlt = block?.media?.alt;

  return (
    <div className={css.root}>
      <TopbarContainer />
      <div className={css.hero}>
        <h1 className={css.heroTitle}>About Us</h1>
      </div>
      <div className={css.content}>
        <div className={css.section}>
          <h2 className={css.sectionTitle} style={{ whiteSpace: 'pre-line' }}>
            {birthTitle}
          </h2>
          <div className={css.sectionText}>{birthContent}</div>
        </div>
        <div className={css.missionSection}>
          {missionImage ? (
            <img src={missionImage} alt={missionImageAlt} className={css.missionImage} />
          ) : null}
          <div className={css.missionContent}>
            <h2 className={css.missionTitle}>{missionTitle}</h2>
            <div className={css.missionText}>{missionContent}</div>
          </div>
        </div>
        <div className={css.differentSection}>
          <h2 className={css.differentTitle} style={{ whiteSpace: 'pre-line' }}>
            {differentTitle}
          </h2>
          <div className={css.differentText}>{differentContent}</div>
        </div>
      </div>
      <FooterContainer />
    </div>
  );
};

export default AboutUsPage;
