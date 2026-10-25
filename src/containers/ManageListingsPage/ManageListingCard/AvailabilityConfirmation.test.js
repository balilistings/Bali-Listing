import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailabilityConfirmation from './AvailabilityConfirmation';
import { post } from '../../../util/api';
jest.mock('../../../util/api',()=>({post:jest.fn()}));
const listing={id:{uuid:'listing'},attributes:{state:'published',privateData:{}}};
beforeEach(()=>jest.clearAllMocks());
test('unknown availability changes only after a successful explicit confirmation',async()=>{
 post.mockResolvedValue({confirmedAvailableAt:'2026-10-25T00:00:00Z'});
 render(<AvailabilityConfirmation listing={listing}/>);
 expect(screen.getByText('Availability not yet confirmed')).toBeInTheDocument();
 expect(post).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button',{name:'Confirm still available'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Confirmed available'})).toBeDisabled());
 expect(post).toHaveBeenCalledWith('/api/listings/confirm-availability',{listingId:'listing'});
});
test('a save failure leaves the listing unconfirmed and allows retry',async()=>{
 post.mockRejectedValue(new Error('failed'));render(<AvailabilityConfirmation listing={listing}/>);
 fireEvent.click(screen.getByRole('button',{name:'Confirm still available'}));
 await screen.findByRole('alert');expect(screen.getByText('Availability not yet confirmed')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Confirm still available'})).toBeEnabled();
});
test('closed listings have no confirmation action',()=>{render(<AvailabilityConfirmation listing={{...listing,attributes:{state:'closed'}}}/>);expect(screen.queryByRole('button')).toBeNull();});
