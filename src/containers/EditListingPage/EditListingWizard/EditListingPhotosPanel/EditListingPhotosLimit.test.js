import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditListingPhotosForm from './EditListingPhotosForm';
import { photoFingerprint } from '../../../../util/photoFile';
jest.mock('../../../../util/photoFile', () => ({ photoFingerprint: jest.fn() }));
beforeEach(() => photoFingerprint.mockReset().mockResolvedValue(null));

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
jest.mock('./ListingImage', () => props => <button type="button" onClick={() => props.onRemoveImage(props.image.id)}>Remove photo</button>);

const setup = count => {
  const resolvers = [];
  const onImageUpload = jest.fn(() => new Promise(resolve => resolvers.push(resolve)));
  const onSubmit = jest.fn();
  const form = images => <EditListingPhotosForm
    initialValues={{ images }}
    onImageUpload={onImageUpload} onSubmit={onSubmit} onRemoveImage={() => {}}
    saveActionMsg="Save photos" listingImageConfig={{}} />;
  const { rerender } = render(form(Array.from({ length: count }, (_, i) => ({ id: `saved-${i}` }))));
  return { onImageUpload, onSubmit, resolvers, updateImages: images => rerender(form(images)) };
};

it('reserves only 20 slots for a 25-file batch before any upload completes', async () => {
  const { onImageUpload } = setup(0);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(20);
  expect(screen.getByRole('status')).toHaveTextContent('Extra selected photos were not uploaded');
  expect(screen.getByText('Save photos')).toBeDisabled();
});

it('allows only the remaining slot and keeps saving disabled until uploads finish', async () => {
  const { onImageUpload, resolvers } = setup(19);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
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

it('allows a new photo after removing one from a full gallery', async () => {
  const { onImageUpload } = setup(20);
  userEvent.click(screen.getAllByText('Remove photo')[0]);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(1);
});

it('skips renamed copies in a batch and repeated selection after success', async () => {
  photoFingerprint.mockResolvedValue('same-bytes');
  const { onImageUpload, resolvers } = setup(0);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Duplicate photo skipped/)).toBeInTheDocument();
  await act(async () => resolvers[0]({ payload: { data: { imageId: { uuid: 'saved' } } } }));
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(1);
});

it('allows a retry after the upload action reports an error', async () => {
  photoFingerprint.mockResolvedValue('same-bytes');
  const { onImageUpload, resolvers } = setup(0);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  await act(async () => resolvers[0]({ error: true }));
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(2);
});

it('allows selecting a photo again after removing its saved image', async () => {
  photoFingerprint.mockResolvedValue('same-bytes');
  const { onImageUpload, resolvers, updateImages } = setup(0);
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  await act(async () => resolvers[0]({ payload: { data: { imageId: { uuid: 'saved' } } } }));
  updateImages([{ id: { uuid: 'saved' } }]);
  userEvent.click(screen.getByText('Remove photo'));
  await act(async () => userEvent.click(screen.getByText('Select 25 photos')));
  expect(onImageUpload).toHaveBeenCalledTimes(2);
});

