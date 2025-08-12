
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PurchasesPage from '@/app/purchases/page';
import * as actions from '@/lib/actions';
import { type Counterparty, type PurchaseOrder } from '@prisma/client';

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getPurchaseOrders: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

const mockGetPurchaseOrders = actions.getPurchaseOrders as jest.Mock;

type PurchaseOrderWithCounterparty = PurchaseOrder & { counterparty: Counterparty };

const mockCounterparties: Counterparty[] = [
  { id: '1', name: 'Vendor A', email: 'contact@vendora.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['VENDOR'], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Supplies Co.', email: 'support@supplies.co', phone: '234-567-8901', address: '456 Business Blvd', types: ['VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];

const mockPurchaseOrders: PurchaseOrderWithCounterparty[] = [
  { 
    id: 'po1', 
    orderNumber: 'PO-2024-001',
    counterpartyId: '1',
    counterparty: mockCounterparties[0],
    orderDate: new Date('2024-07-20'),
    status: 'Received',
    subtotal: 1000,
    tax: 100,
    total: 1100,
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
  { 
    id: 'po2', 
    orderNumber: 'PO-2024-002',
    counterpartyId: '2',
    counterparty: mockCounterparties[1],
    orderDate: new Date('2024-07-18'),
    status: 'Pending',
    subtotal: 500,
    tax: 50,
    total: 550,
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
];

describe('PurchasesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPurchaseOrders.mockResolvedValue(mockPurchaseOrders);
  });

  it('renders the purchases page with initial orders', async () => {
    render(<PurchasesPage />);
    
    expect(screen.getByRole('heading', { name: /purchases/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
      expect(screen.getByText('PO-2024-002')).toBeInTheDocument();
    });
  });

  it('displays correct vendor names and totals', async () => {
    render(<PurchasesPage />);

    await waitFor(() => {
      expect(screen.getByText('Vendor A')).toBeInTheDocument();
      expect(screen.getByText('$1100.00')).toBeInTheDocument();
      
      expect(screen.getByText('Supplies Co.')).toBeInTheDocument();
      expect(screen.getByText('$550.00')).toBeInTheDocument();
    });
  });

  it('displays the correct status badges', async () => {
    render(<PurchasesPage />);
    
    await waitFor(() => {
      const receivedBadge = screen.getByText('Received');
      expect(receivedBadge).toBeInTheDocument();
      expect(receivedBadge).toHaveClass('bg-green-500/20');
      
      const pendingBadge = screen.getByText('Pending');
      expect(pendingBadge).toBeInTheDocument();
      expect(pendingBadge).toHaveClass('bg-yellow-500/20');
    });
  });

  it('renders the "Create Purchase" button with the correct link', () => {
    render(<PurchasesPage />);
    const createButton = screen.getByRole('link', { name: /create purchase/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/purchases/new');
  });
});
