import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditListingPhotosForm from './EditListingPhotosForm';

jest.mock('../../../../util/reactIntl', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id }),
  FormattedMessage: ({ id }) => <span>{id}</span>,
}));
jest.mock('../../../../components', () => ({
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
  Button: ({ children, inProgress, ready, ...props }) => <button {...props}>{children}</button>,
  AspectRatioWrapper: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../../../components/FieldAddImageMultiple', () => props => (
  <button type="button" disabled={props.disabled} onClick={() => {
    for (let i = 0; i < 25; i++) props.onImageUploadHandler(new File(['x'], `${i}.jpg`));
  }}>Select 25 photos</button>
));
jest.mock('./ListingImage', () => props => <button type="button" onClick={props.onRemoveImage}>Remove photo</button>);

const setup = count => {
  const resolvers = [];
  const onImageUpload = jest.fn(() => new Promise(resolve => resolvers.push(resolve)));
  const onSubmit = jest.fn();
  render(<EditListingPhotosForm
    initialValues={{ images: Array.from({ length: count }, (_, i) => ({ id: `saved-${i}` })) }}
    onImageUpload={onImageUpload} onSubmit={onSubmit} onRemoveImage={() => {}}
    saveActionMsg="Save photos" listingImageConfig={{}} />);
  return { onImageUpload, onSubmit, resolvers };
};

it('reserves only 20 slots for a 25-file batch before any upload completes', () => {
  const { onImageUpload } = setup(0);
  userEvent.click(screen.getByText('Select 25 photos'));
  expect(onImageUpload).toHaveBeenCalledTimes(20);
  expect(screen.getByRole('status')).toHaveTextContent('Extra selected photos were not uploaded');
  expect(screen.getByText('Save photos')).toBeDisabled();
});

it('allows only the remaining slot and keeps saving disabled until uploads finish', async () => {
  const { onImageUpload, resolvers } = setup(19);
  userEvent.click(screen.getByText('Select 25 photos'));
  expect(onImageUpload).toHaveBeenCalledTimes(1);
  await act(async () => resolvers[0]());
  expect(screen.getByText('Save photos')).not.toBeDisabled();
});

it('preserves an existing 30-photo gallery and allows saving it', () => {
  const { onImageUpload, onSubmit } = setup(30);
  expect(screen.getAllByText('Remove photo')).toHaveLength(30);
  expect(screen.getByText('Select 25 photos')).toBeDisabled();
  userEvent.click(screen.getByText('Save photos'));
  expect(onSubmit.mock.calls[0][0].images).toHaveLength(30);
  expect(onImageUpload).not.toHaveBeenCalled();
});

it('allows a new photo after removing one from a full gallery', () => {
  const { onImageUpload } = setup(20);
  userEvent.click(screen.getAllByText('Remove photo')[0]);
  userEvent.click(screen.getByText('Select 25 photos'));
  expect(onImageUpload).toHaveBeenCalledTimes(1);
});

