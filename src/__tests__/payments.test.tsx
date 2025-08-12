
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsPage from '@/app/payments/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Client, type Payment } from '@prisma/client';

// Custom type for the test, as the component expects a client object within the payment
type PaymentWithClient = Payment & { client: Client };

// Mock server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getPayments: jest.fn(),
  createPayment: jest.fn(),
  getClients: jest.fn(),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockGetPayments = actions.getPayments as jest.Mock;
const mockCreatePayment = actions.createPayment as jest.Mock;
const mockGetClients = actions.getClients as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockClients: Client[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Solutions Co.', email: 'support@solutions.co', phone: '234-567-8901', address: '456 Business Blvd', createdAt: new Date(), updatedAt: new Date() },
];

const mockPayments: PaymentWithClient[] = [
  { 
    id: 'pay1', 
    date: new Date('2024-07-20'), 
    clientId: '1', 
    client: mockClients[0],
    description: 'Payment for INV-001', 
    amount: 1500, 
    type: 'Bank Transfer', 
    status: 'Received',
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
   { 
    id: 'pay2', 
    date: new Date('2024-07-18'), 
    clientId: '2',
    client: mockClients[1],
    description: 'Office Supplies', 
    amount: -250, 
    type: 'Cash', 
    status: 'Sent',
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
];

describe('PaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPayments.mockResolvedValue(mockPayments);
    mockGetClients.mockResolvedValue(mockClients);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the payments page with initial data', async () => {
    render(<PaymentsPage />);
    
    expect(screen.getByRole('heading', { name: /payments/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Payment for INV-001')).toBeInTheDocument();
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });
  });

  it('allows searching for a payment by description', async () => {
    render(<PaymentsPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Payment for INV-001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    await user.type(searchInput, 'INV-001');

    expect(screen.getByText('Payment for INV-001')).toBeInTheDocument();
    expect(screen.queryByText('Office Supplies')).not.toBeInTheDocument();
  });
  
  it('opens the add income sheet and creates a new income payment', async () => {
    const newPayment: Payment = { id: 'pay3', amount: 500, type: 'Bank Transfer', status: 'Received', description: 'New Income', clientId: '1', date: new Date(), createdAt: new Date(), updatedAt: new Date() };
    mockCreatePayment.mockResolvedValue({ success: true, data: newPayment });
    
    render(<PaymentsPage />);
    const user = userEvent.setup();

    // Open sheet
    const addIncomeButton = screen.getByRole('button', { name: /add income/i });
    await user.click(addIncomeButton);
    
    // Wait for clients to load in the sheet
    await waitFor(() => expect(screen.getByText('Add Income')).toBeInTheDocument());

    // Fill form
    await user.type(screen.getByLabelText('Amount *'), '500');
    await user.type(screen.getByLabelText('Description *'), 'New Income');

    // Select a client
    const clientSelect = screen.getByRole('combobox', {name: /client/i});
    await user.click(clientSelect);
    await user.click(await screen.findByText('Innovate Inc.'));

    // Save
    await user.click(screen.getByRole('button', { name: 'Save Payment' }));
    
    // Assertions
    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith({
        amount: 500,
        type: 'Bank Transfer',
        status: 'Received',
        description: 'New Income',
        clientId: '1',
      });
    });

     await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Payment Received',
        description: 'The received of $500.00 has been recorded.',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('New Income')).toBeInTheDocument();
    });

    // Check if sheet is closed
    expect(screen.queryByRole('heading', { name: /add income/i })).not.toBeInTheDocument();
  });
});
