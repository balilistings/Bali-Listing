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
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage';
import { loadData } from './AboutUsPage.duck';

import css from './AboutUsPage.module.css';
import { FormattedMessage } from 'react-intl';
import { ReactComponent as Spiral } from '../../assets/about-us-spiral.svg';

const renderAst = new rehypeReact({ createElement: React.createElement }).Compiler;

const AboutUsPage = props => {
  const dispatch = useDispatch();
  const params = useParams();
  const pageId = 'about-new';

  const { pageAssetsData, inProgress, error } = useSelector(
    state => state.hostedAssets || {},
    shallowEqual
  );

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
        <Spiral className={css.spiral} />
        <h1 className={css.heroTitle}>
          <FormattedMessage id="TranslatedLink.aboutUs" />
        </h1>
      </div>
      <div className={css.content}>
        {blocks.map((block, i) => {
          const title = block.title?.content;
          const rawContent = block.text?.content;
          const image = block.media?.image;
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
            const imageVariants = image ? Object.keys(image.attributes?.variants || {}) : [];
            return (
              <div key={i} className={css.missionParent}>
                <h2 className={`${css.missionTitle} ${css.mobileOnly}`}>{title}</h2>
                <div className={css.missionSection}>
                  {image ? (
                    <ResponsiveImage
                      alt={imageAlt || title}
                      image={image}
                      variants={imageVariants}
                      className={css.missionImage}
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  ) : null}
                  <div className={css.missionContent}>
                    <h2 className={`${css.missionTitle} ${css.desktopOnly}`}>{title}</h2>
                    <div className={css.missionText}>{toReact(rawContent)}</div>
                  </div>
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

            const imageVariants = image ? Object.keys(image.attributes?.variants || {}) : [];
            return (
              <div key={i} className={css.missionParent}>
                <h3 className={`$ ${css.mobileOnly}`}>{title}</h3>
                <div className={css.featureSection}>
                  <div className={css.missionContent}>
                    <h3 className={`${css.desktopOnly}`}>{title}</h3>
                    <div className={css.missionText}>{toReact(mainText)}</div>
                    <div className={css.pillsContainer}>
                      {pills.map((pill, j) => (
                        <div key={j} className={css.pill}>
                          {pill}
                        </div>
                      ))}
                    </div>
                  </div>
                  {image ? (
                    <ResponsiveImage
                      alt={imageAlt || title}
                      image={image}
                      variants={imageVariants}
                      className={css.missionImage}
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  ) : null}
                </div>
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

            const imageVariants = image ? Object.keys(image.attributes?.variants || {}) : [];
            return (
              <div key={i} className={css.missionParent}>
                <h3 className={`${css.mobileOnly}`}>{title}</h3>
                <div className={css.missionSection}>
                  {image ? (
                    <ResponsiveImage
                      alt={imageAlt || title}
                      image={image}
                      variants={imageVariants}
                      className={css.missionImage}
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  ) : null}
                  <div className={css.missionContent}>
                    <h3 className={`${css.desktopOnly}`}>{title}</h3>
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
                      <p className={css.statNumber}>{stat.number}</p>
                      <p className={css.statLabel}>{stat.label}</p>
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
