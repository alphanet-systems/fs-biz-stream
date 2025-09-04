
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsPage from '@/app/payments/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Counterparty, type Payment, type Wallet } from '@prisma/client';

// Custom type for the test, as the component expects related objects within the payment
type PaymentWithRelations = Payment & { 
    counterparty: Omit<Counterparty, 'types'> & { types: string[] }; 
    wallet: Wallet 
};

// Mock server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getPayments: jest.fn(),
  createPayment: jest.fn(),
  getCounterparties: jest.fn(),
  getWallets: jest.fn(),
  createWallet: jest.fn(),
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
const mockGetCounterparties = actions.getCounterparties as jest.Mock;
const mockGetWallets = actions.getWallets as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockCounterparties: (Omit<Counterparty, 'types'> & { types: string[] })[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Solutions Co.', email: 'support@solutions.co', phone: '234-567-8901', address: '456 Business Blvd', types: ['CLIENT', 'VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];

const mockWallets: Wallet[] = [
    { id: 'w1', name: 'Main Bank Account', balance: 5000, createdAt: new Date(), updatedAt: new Date() },
    { id: 'w2', name: 'Cash Drawer', balance: 350, createdAt: new Date(), updatedAt: new Date() },
];

const mockPayments: PaymentWithRelations[] = [
  { 
    id: 'pay1', 
    date: new Date('2024-07-20'), 
    counterpartyId: '1', 
    counterparty: mockCounterparties[0],
    walletId: 'w1',
    wallet: mockWallets[0],
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
    counterpartyId: '2',
    counterparty: mockCounterparties[1],
    walletId: 'w2',
    wallet: mockWallets[1],
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
    mockGetWallets.mockResolvedValue(mockWallets);
    mockGetCounterparties.mockResolvedValue(mockCounterparties);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the payments page with initial data, including wallets and payments', async () => {
    render(<PaymentsPage />);
    
    expect(screen.getByRole('heading', { name: /payments/i })).toBeInTheDocument();
    
    // Check for wallets
    await waitFor(() => {
      expect(screen.getByText('Main Bank Account')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('Cash Drawer')).toBeInTheDocument();
      expect(screen.getByText('$350.00')).toBeInTheDocument();
    });

    // Check for payments
    await waitFor(() => {
      expect(screen.getByText('Payment for INV-001')).toBeInTheDocument();
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });
  });
  
  it('opens the add income sheet and creates a new income payment', async () => {
    render(<PaymentsPage />);
    const user = userEvent.setup();

    mockCreatePayment.mockResolvedValue({ success: true, data: {} as Payment });

    // Open sheet
    const addIncomeButton = screen.getByRole('button', { name: /add income/i });
    await user.click(addIncomeButton);
    
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Add Income' })).toBeInTheDocument());
    expect(await screen.findByText('Select a wallet')).toBeInTheDocument();

    // Fill form
    // Select a wallet
    await user.click(screen.getByRole('button', { name: /select a wallet/i }));
    await user.click(await screen.findByText(/Main Bank Account/));
    
    const amountInput = screen.getByLabelText('Amount *');
    await user.clear(amountInput);
    await user.type(amountInput, '500');
    
    // Select a counterparty
    await user.click(screen.getByRole('button', { name: /select a counterparty/i }));
    await user.click(await screen.findByText('Innovate Inc.'));

    await user.type(screen.getByLabelText('Description *'), 'New Income');

    // Save
    await user.click(screen.getByRole('button', { name: 'Save Payment' }));
    
    // Assertions
    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith({
        amount: 500,
        type: 'Bank Transfer', // default value
        status: 'Received',
        description: 'New Income',
        counterpartyId: '1',
        walletId: 'w1'
      });
    });

     await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Payment Received',
        description: 'The received of $500.00 has been recorded.',
      });
    });

    // We refetch all data on success now
    await waitFor(() => {
      expect(mockGetPayments).toHaveBeenCalledTimes(2);
      expect(mockGetWallets).toHaveBeenCalledTimes(2);
    });

    // Check if sheet is closed
    expect(screen.queryByRole('heading', { name: /add income/i })).not.toBeInTheDocument();
  });
});
