import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ListingImageGallery from './ListingImageGallery';

jest.mock('../../../util/reactIntl', () => ({
  useIntl: () => ({ formatMessage: (_, values) => `Photo ${values?.index || ''}` }),
  FormattedMessage: () => <span>View images</span>,
}));
jest.mock('../../../components', () => ({
  AspectRatioWrapper: ({ children }) => <div>{children}</div>,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  IconClose: () => null,
  IconArrowHead: () => null,
  ResponsiveImage: ({ image, alt, variants }) => <img alt={alt} srcSet={image?.attributes?.variants?.[variants[0]]?.url} />,
}));
jest.mock('react-image-gallery', () => props => <div>
  {props.items.map(item => <div key={item.index}>{props.renderItem(item)}{props.renderThumbInner(item)}</div>)}
  <button onClick={() => { props.onBeforeSlide(2); props.onSlide(2); }}>Select third photo</button>
  {props.renderFullscreenButton(() => props.onScreenChange(true), false)}
</div>);

test('initial gallery exposes only cover URLs and selection loads another photo', () => {
  const images = [0, 1, 2].map(i => ({ attributes: { variants: { scaled: { url: `photo-${i}.jpg`, width: 800, height: 600 } } } }));
  const { container, getByRole } = render(<ListingImageGallery images={images} imageVariants={['scaled']} />);
  const sources = () => [...container.querySelectorAll('img[srcset]')].map(img => img.getAttribute('srcset'));
  expect(sources()).toEqual(['photo-0.jpg', 'photo-0.jpg']);
  fireEvent.click(getByRole('button', { name: 'Select third photo' }));
  expect(sources()).toEqual(['photo-0.jpg', 'photo-0.jpg', 'photo-2.jpg', 'photo-2.jpg']);
});
