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
import IconSolution from '../../components/IconSolution/IconSolution';
import { loadData } from './SolutionHubPage.duck';
import { ReactComponent as Spiral } from '../../assets/about-us-spiral.svg';
import CTABlock from '../../components/CTABlock/CTABlock';

import css from './SolutionHubPage.module.css';

const renderAst = new rehypeReact({ createElement: React.createElement }).Compiler;

const SolutionHubPage = props => {
  const dispatch = useDispatch();
  const params = useParams();

  const pageId = 'solution-hub';

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

  const renderBlock = (block, i) => {
    const title = block.title?.content;
    const rawContent = block.text?.content;
    const callToAction = block.callToAction;

    let tag = null;
    let content = rawContent || '';
    let subtitle = '';

    if (content.startsWith('--')) {
      const parts = content.split('--');
      if (parts.length > 2) {
        tag = parts[1];
        content = parts
          .slice(2)
          .join('--')
          .trim();
      }
    }

    const contentParts = content.split('\n\n');
    if (contentParts[0].startsWith('**') && contentParts[0].endsWith('**')) {
      subtitle = contentParts[0].replace(/\*\*/g, '');
      content = contentParts.slice(1).join('\n\n');
    }

    return (
      <div key={i} className={css.block}>
        {tag && <div className={css.tag}>{tag}</div>}
        <div className={css.imageWrapper}>
          <IconSolution solutionName={title} />
        </div>
        <h3 className={css.blockTitle}>{title}</h3>
        {subtitle && <p className={css.blockSubtitle}>{subtitle}</p>}
        <div className={css.blockText}>{toReact(content)}</div>
        {callToAction?.fieldType === 'externalButtonLink' && callToAction.href && (
          <a
            href={callToAction.href}
            className={css.blockButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            {callToAction.content}
          </a>
        )}
      </div>
    );
  };

  const descriptionContent = section?.description?.content || '';
  const descriptionParts = descriptionContent.split('###');
  const subTitle = descriptionParts.length > 1 ? descriptionParts[1] : '';
  const description =
    descriptionParts.length > 2 ? descriptionParts[2].trim() : descriptionParts[0];

  return (
    <div className={css.root}>
      <TopbarContainer />
      <div className={css.hero}>
        <Spiral className={css.spiral} />
        <h1 className={css.heroTitle}>{section?.title?.content}</h1>
      </div>
      <div className={css.mainContentContainer}>
        <div className={css.pageHeader}>
          <div className={css.pageTitleWrapper}>
            <h1 className={css.pageTitle}>{subTitle}</h1>
          </div>
          <div className={css.pageSubtitle}>{toReact(description)}</div>
        </div>

        <div className={css.content}>
          <div className={css.blocksGrid}>{blocks.map(renderBlock)}</div>
        </div>
      </div>
      <CTABlock />
      <FooterContainer />
    </div>
  );
};

export default SolutionHubPage;
