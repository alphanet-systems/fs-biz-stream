
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CounterpartiesPage from '@/app/clients/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Counterparty } from '@prisma/client';

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getCounterparties: jest.fn(),
  createCounterparty: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockGetCounterparties = actions.getCounterparties as jest.Mock;
const mockCreateCounterparty = actions.createCounterparty as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockCounterparties: Counterparty[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Vendor Supply Co.', email: 'support@vendor.co', phone: '234-567-8901', address: '456 Business Blvd', types: ['VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];

describe('CounterpartiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCounterparties.mockResolvedValue(mockCounterparties);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the counterparties page with initial data', async () => {
    render(<CounterpartiesPage />);
    
    expect(screen.getByRole('heading', { name: /counterparties/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
      expect(screen.getByText('Vendor Supply Co.')).toBeInTheDocument();
    });
  });

  it('allows searching for a counterparty', async () => {
    render(<CounterpartiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search counterparties');
    await userEvent.type(searchInput, 'Innovate');

    expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
    expect(screen.queryByText('Vendor Supply Co.')).not.toBeInTheDocument();
  });

  it('opens the add counterparty sheet and validates the form', async () => {
    render(<CounterpartiesPage />);
    const user = userEvent.setup();

    const addCounterpartyButton = screen.getByRole('button', { name: /add new/i });
    await user.click(addCounterpartyButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'New Counterparty');

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'new@party.com');

    // Default type 'CLIENT' is checked, so form should be valid
    expect(saveButton).toBeEnabled();

    // Test invalid email
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    expect(saveButton).toBeDisabled();
    
    // Test unchecking all types
    await user.clear(emailInput);
    await user.type(emailInput, 'new@party.com');
    expect(saveButton).toBeEnabled();
    const clientCheckbox = screen.getByLabelText('Client');
    await user.click(clientCheckbox);
    expect(saveButton).toBeDisabled();
  });

  it('successfully creates a new counterparty and closes the sheet', async () => {
    const newCounterparty: Counterparty = { id: '3', name: 'New Client', email: 'new@client.com', phone: '111-222-3333', address: '1 Test St', types: ['CLIENT', 'VENDOR'], createdAt: new Date(), updatedAt: new Date() };
    mockCreateCounterparty.mockResolvedValue({ success: true, data: newCounterparty });
    
    render(<CounterpartiesPage />);
    const user = userEvent.setup();

    const addCounterpartyButton = screen.getByRole('button', { name: /add new/i });
    await user.click(addCounterpartyButton);

    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, newCounterparty.name);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, newCounterparty.email);

    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.type(phoneInput, newCounterparty.phone as string);
    
    const addressInput = screen.getByLabelText(/address/i);
    await user.type(addressInput, newCounterparty.address as string);

    // Make it a vendor too
    const vendorCheckbox = screen.getByLabelText('Vendor');
    await user.click(vendorCheckbox);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateCounterparty).toHaveBeenCalledWith({
        name: newCounterparty.name,
        email: newCounterparty.email,
        phone: newCounterparty.phone,
        address: newCounterparty.address,
        types: ['CLIENT', 'VENDOR']
      });
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Counterparty Saved',
        description: `${newCounterparty.name} has been successfully added.`,
      });
    });

    await waitFor(() => {
        expect(screen.getByText(newCounterparty.name)).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: /add new counterparty/i })).not.toBeInTheDocument();
  });

  it('shows an error toast if counterparty creation fails', async () => {
    mockCreateCounterparty.mockResolvedValue({ success: false, error: "Database error" });

    render(<CounterpartiesPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add new/i }));
    
    await user.type(screen.getByLabelText(/full name/i), 'Fail Party');
    await user.type(screen.getByLabelText(/email address/i), 'fail@party.com');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            title: "Error",
            description: "Database error",
            variant: "destructive",
        });
    });
  });
});

    