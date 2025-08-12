
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsPage from '@/app/payments/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Counterparty, type Payment } from '@prisma/client';

// Custom type for the test, as the component expects a counterparty object within the payment
type PaymentWithCounterparty = Payment & { counterparty: Counterparty };

// Mock server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getPayments: jest.fn(),
  createPayment: jest.fn(),
  getCounterparties: jest.fn(),
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
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockCounterparties: Counterparty[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Solutions Co.', email: 'support@solutions.co', phone: '234-567-8901', address: '456 Business Blvd', types: ['CLIENT', 'VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];

const mockPayments: PaymentWithCounterparty[] = [
  { 
    id: 'pay1', 
    date: new Date('2024-07-20'), 
    counterpartyId: '1', 
    counterparty: mockCounterparties[0],
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
    mockGetCounterparties.mockResolvedValue(mockCounterparties);
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
    const newPaymentData = { amount: 500, type: 'Bank Transfer', status: 'Received', description: 'New Income', counterpartyId: '1' };
    const returnedPayment: Payment = { ...newPaymentData, id: 'pay3', date: new Date(), createdAt: new Date(), updatedAt: new Date() };
    const returnedPaymentWithCounterparty: PaymentWithCounterparty = { ...returnedPayment, counterparty: mockCounterparties[0] };
    
    // The create action returns the raw payment, but the page state requires the joined data.
    // So we need to mock both the creation and the subsequent refetch.
    mockCreatePayment.mockResolvedValue({ success: true, data: returnedPayment });
    mockGetPayments.mockResolvedValue([...mockPayments, returnedPaymentWithCounterparty]);


    render(<PaymentsPage />);
    const user = userEvent.setup();

    // Open sheet
    const addIncomeButton = screen.getByRole('button', { name: /add income/i });
    await user.click(addIncomeButton);
    
    // Wait for counterparties to load in the sheet
    await waitFor(() => expect(screen.getByText('Add Income')).toBeInTheDocument());

    // Fill form
    await user.type(screen.getByLabelText('Amount *'), '500');
    await user.type(screen.getByLabelText('Description *'), 'New Income');

    // Select a counterparty
    const counterpartySelect = screen.getAllByRole('combobox')[0]; // There are multiple selects on the page now
    fireEvent.mouseDown(counterpartySelect);
    const innovateOption = await screen.findByText('Innovate Inc.');
    fireEvent.click(innovateOption);

    // Save
    await user.click(screen.getByRole('button', { name: 'Save Payment' }));
    
    // Assertions
    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith({
        amount: 500,
        type: 'Bank Transfer',
        status: 'Received',
        description: 'New Income',
        counterpartyId: '1',
      });
    });

     await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Payment Received',
        description: 'The received of $500.00 has been recorded.',
      });
    });

    // We now refetch payments on success, so wait for the new item to appear
    await waitFor(() => {
      expect(screen.getByText('New Income')).toBeInTheDocument();
    });

    // Check if sheet is closed
    expect(screen.queryByRole('heading', { name: /add income/i })).not.toBeInTheDocument();
  });
});
