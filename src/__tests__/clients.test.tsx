
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsPage from '@/app/clients/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Client } from '@prisma/client';

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getClients: jest.fn(),
  createClient: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockGetClients = actions.getClients as jest.Mock;
const mockCreateClient = actions.createClient as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockClients: Client[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Solutions Co.', email: 'support@solutions.co', phone: '234-567-8901', address: '456 Business Blvd', createdAt: new Date(), updatedAt: new Date() },
];

describe('ClientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClients.mockResolvedValue(mockClients);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the clients page with initial data', async () => {
    render(<ClientsPage />);
    
    expect(screen.getByRole('heading', { name: /clients/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
      expect(screen.getByText('Solutions Co.')).toBeInTheDocument();
    });
  });

  it('allows searching for a client', async () => {
    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search clients');
    await userEvent.type(searchInput, 'Innovate');

    expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
    expect(screen.queryByText('Solutions Co.')).not.toBeInTheDocument();
  });

  it('opens the add client sheet and validates the form', async () => {
    render(<ClientsPage />);
    const user = userEvent.setup();

    const addClientButton = screen.getByRole('button', { name: /add client/i });
    await user.click(addClientButton);

    const saveButton = screen.getByRole('button', { name: /save client/i });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'New Client');

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'new@client.com');

    expect(saveButton).toBeEnabled();

    // Test invalid email
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    expect(saveButton).toBeDisabled();
    expect(await screen.findByText('Please enter a valid email.')).toBeInTheDocument();
  });

  it('successfully creates a new client and closes the sheet', async () => {
    const newClient: Client = { id: '3', name: 'New Client', email: 'new@client.com', phone: '111-222-3333', address: '1 Test St', createdAt: new Date(), updatedAt: new Date() };
    mockCreateClient.mockResolvedValue({ success: true, data: newClient });
    
    render(<ClientsPage />);
    const user = userEvent.setup();

    const addClientButton = screen.getByRole('button', { name: /add client/i });
    await user.click(addClientButton);

    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, newClient.name);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, newClient.email);

    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.type(phoneInput, newClient.phone as string);
    
    const addressInput = screen.getByLabelText(/address/i);
    await user.type(addressInput, newClient.address as string);

    const saveButton = screen.getByRole('button', { name: /save client/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
      });
    });
    
    // Check if the toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Client Saved',
        description: `${newClient.name} has been successfully added.`,
      });
    });

    // Check if the new client appears in the table
    await waitFor(() => {
        expect(screen.getByText(newClient.name)).toBeInTheDocument();
    });

    // Check if the sheet is closed
    expect(screen.queryByRole('heading', { name: /add new client/i })).not.toBeInTheDocument();
  });

  it('shows an error toast if client creation fails', async () => {
    mockCreateClient.mockResolvedValue({ success: false, error: "Database error" });

    render(<ClientsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add client/i }));
    
    await user.type(screen.getByLabelText(/full name/i), 'Fail Client');
    await user.type(screen.getByLabelText(/email address/i), 'fail@client.com');

    await user.click(screen.getByRole('button', { name: /save client/i }));

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            title: "Error",
            description: "Database error",
            variant: "destructive",
        });
    });
  });
});
