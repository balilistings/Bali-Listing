import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import unified from 'unified';
import parse from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeReact from 'rehype-react';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer.js';
import Accordion from '../../components/Accordion/Accordion';
import { loadData } from './FAQPage.duck';
import CTABlock from '../../components/CTABlock/CTABlock';

import css from './FAQPage.module.css';

const renderAst = new rehypeReact({ createElement: React.createElement }).Compiler;

const FAQPage = props => {
  const dispatch = useDispatch();
  const params = useParams();
  const pageId = params.pageId || 'faq';

  const { pageAssetsData, inProgress, error } = useSelector(state => state.hostedAssets || {});
  const [activeTab, setActiveTab] = useState(1); // Default to providers

  useEffect(() => {
    if (inProgress || pageAssetsData?.[pageId]) {
      return;
    }
    dispatch(loadData(params));
  }, [dispatch, params, pageId, inProgress, pageAssetsData]);

  if (!inProgress && error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const pageData = pageAssetsData?.[pageId]?.data;
  const sections = pageData?.sections || [];
  const faqSection = sections[0] || {};
  const faqBlocks = faqSection.blocks || [];
  const faqContent = faqBlocks[activeTab]?.text?.content || '';

  const processor = unified().use(parse);
  const ast = processor.parse(faqContent);

  const faqItems = ast.children.reduce((acc, node, index) => {
    if (node.type === 'heading' && node.depth === 2) {
      const title = node.children[0].value;
      const contentNodes = [];
      let nextNodeIndex = index + 1;
      while (nextNodeIndex < ast.children.length && ast.children[nextNodeIndex].type !== 'heading') {
        contentNodes.push(ast.children[nextNodeIndex]);
        nextNodeIndex++;
      }
      const contentAst = { type: 'root', children: contentNodes };
      const content = renderAst(unified().use(remark2rehype).runSync(contentAst));

      acc.push({
        key: title,
        title: title,
        content: content,
      });
    }
    return acc;
  }, []);

  const tabs = [
    { id: 'customers', label: 'Customers' },
    { id: 'providers', label: 'Providers' },
    { id: 'general', label: 'General' },
  ];

  return (
    <div className={css.root}>
      <TopbarContainer />
      <div className={css.content}>
        <div className={css.leftColumn}>
          <div className={css.tag}>FAQs</div>
          <h1 className={css.title}>
            Frequently Asked <span>Questions</span>
          </h1>
          <p className={css.description}>
            We know that finding your way around a new platform and sometimes even a new country can bring up a lot of questions. That’s why we’ve created this FAQ section to help you find quick answers.
          </p>
          <div className={css.tabs}>
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                className={activeTab === index ? css.activeTab : css.tab}
                onClick={() => setActiveTab(index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={css.rightColumn}>
          <Accordion items={faqItems} />
        </div>
      </div>
      <CTABlock />
      <FooterContainer />
    </div>
  );
};

export default FAQPage;
