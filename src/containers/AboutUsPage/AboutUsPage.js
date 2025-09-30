import React, { useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
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
  const pageId = 'about-new';

  const { pageAssetsData, inProgress, error } = useSelector(state => state.hostedAssets || {}, shallowEqual);

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

  const toReact = markdown => {
    if (!markdown) return null;
    const content = unified()
      .use(parse)
      .parse(markdown);
    const rehypeAst = unified()
      .use(remark2rehype)
      .runSync(content);
    return renderAst(rehypeAst);
  };

  const section = pageData?.sections?.[0];
  const blocks = section?.blocks || [];

  return (
    <div className={css.root}>
      <TopbarContainer />
      <div className={css.hero}>
        <h1 className={css.heroTitle}>About Us</h1>
      </div>
      <div className={css.content}>
        {blocks.map((block, i) => {
          const title = block.title?.content;
          const rawContent = block.text?.content;
          const image = block.media?.image?.attributes?.variants?.original800?.url;
          const imageAlt = block.media?.alt;

          if (i === 0) {
            return (
              <div key={i} className={css.section}>
                <h2 className={css.sectionTitle} style={{ whiteSpace: 'pre-line' }}>
                  {title}
                </h2>
                <div className={css.sectionText}>{toReact(rawContent)}</div>
              </div>
            );
          }
          if (i === 1 || i === 7) {
            // Mission, Explore
            return (
              <div key={i} className={css.missionSection}>
                {image ? <img src={image} alt={imageAlt} className={css.missionImage} /> : null}
                <div className={css.missionContent}>
                  <h2 className={css.missionTitle}>{title}</h2>
                  <div className={css.missionText}>{toReact(rawContent)}</div>
                </div>
              </div>
            );
          }
          if (i === 2) {
            return (
              <div key={i} className={css.differentSection}>
                <h2 className={css.differentTitle} style={{ whiteSpace: 'pre-line' }}>
                  {title}
                </h2>
                <div className={css.differentText}>{toReact(rawContent)}</div>
              </div>
            );
          }
          if (i === 3 || i === 5) {
            // Smart Filters, Free to use
            const [mainText, pillText] = rawContent.split('\n\n');
            const pills = (pillText || ' ')
              .substring(2)
              .split('\n> ')
              .map(p => p.replace(/\\|\./g, '').trim());

            return (
              <div key={i} className={css.featureSection}>
                <div className={css.missionContent}>
                  <h2 className={css.missionTitle}>{title}</h2>
                  <div className={css.missionText}>{toReact(mainText)}</div>
                  <div className={css.pillsContainer}>
                    {pills.map((pill, j) => (
                      <div key={j} className={css.pill}>
                        {pill}
                      </div>
                    ))}
                  </div>
                </div>
                {image ? <img src={image} alt={imageAlt} className={css.missionImage} /> : null}
              </div>
            );
          }
          if (i === 4) {
            // Verified
            const [mainText, pillText] = rawContent.split('\n\n');
            const pills = (pillText || ' ')
              .substring(2)
              .split('\n> ')
              .map(p => p.replace(/\\|\./g, '').trim());

            return (
              <div key={i} className={css.missionSection}>
                {image ? <img src={image} alt={imageAlt} className={css.missionImage} /> : null}
                <div className={css.missionContent}>
                  <h2 className={css.missionTitle}>{title}</h2>
                  <div className={css.missionText}>{toReact(mainText)}</div>
                  <div className={css.pillsContainer}>
                    {pills.map((pill, j) => (
                      <div key={j} className={css.pill}>
                        {pill}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          if (i === 6) {
            // Why people choose us
            const textParts = rawContent.split('\n\n');
            const mainText = textParts[0];
            const statsContent = textParts[1] || '';
            const stats =
              statsContent.length > 0
                ? statsContent
                    .substring(2)
                    .split('\n> ')
                    .map(s => {
                      const [number, ...labelParts] = s.split('. ');
                      const label = labelParts.join('. ');
                      return {
                        number: number.trim(),
                        label: label.replace(/\\/g, '').trim(),
                      };
                    })
                : [];

            return (
              <div key={i} className={css.statsSection}>
                <h2 className={css.statsTitle}>{title}</h2>
                <div className={css.statsText}>{mainText}</div>
                <div className={css.statsContainer}>
                  {stats.map((stat, j) => (
                    <div key={j} className={css.statItem}>
                      <span className={css.statNumber}>{stat.number}</span>
                      <span className={css.statLabel}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
      <FooterContainer />
    </div>
  );
};

export default AboutUsPage;
