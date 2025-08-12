
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SalesPage from '@/app/sales/page';
import * as actions from '@/lib/actions';
import { type Counterparty, type SalesOrder } from '@prisma/client';

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getSalesOrders: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

const mockGetSalesOrders = actions.getSalesOrders as jest.Mock;

type SalesOrderWithCounterparty = SalesOrder & { counterparty: Counterparty };

const mockCounterparties: Counterparty[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Solutions Co.', email: 'support@solutions.co', phone: '234-567-8901', address: '456 Business Blvd', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
];

const mockSalesOrders: SalesOrderWithCounterparty[] = [
  { 
    id: 'so1', 
    orderNumber: 'SO-2024-001',
    counterpartyId: '1',
    counterparty: mockCounterparties[0],
    orderDate: new Date('2024-07-20'),
    status: 'Fulfilled',
    subtotal: 1500,
    tax: 150,
    total: 1650,
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
  { 
    id: 'so2', 
    orderNumber: 'SO-2024-002',
    counterpartyId: '2',
    counterparty: mockCounterparties[1],
    orderDate: new Date('2024-07-18'),
    status: 'Pending',
    subtotal: 250,
    tax: 25,
    total: 275,
    createdAt: new Date(), 
    updatedAt: new Date(),
  },
];

describe('SalesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSalesOrders.mockResolvedValue(mockSalesOrders);
  });

  it('renders the sales page with initial orders', async () => {
    render(<SalesPage />);
    
    expect(screen.getByRole('heading', { name: /sales/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('SO-2024-001')).toBeInTheDocument();
      expect(screen.getByText('SO-2024-002')).toBeInTheDocument();
    });
  });

  it('displays correct counterparty names and totals', async () => {
    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText('Innovate Inc.')).toBeInTheDocument();
      expect(screen.getByText('$1650.00')).toBeInTheDocument();
      
      expect(screen.getByText('Solutions Co.')).toBeInTheDocument();
      expect(screen.getByText('$275.00')).toBeInTheDocument();
    });
  });

  it('displays the correct status badges', async () => {
    render(<SalesPage />);
    
    await waitFor(() => {
      const fulfilledBadge = screen.getByText('Fulfilled');
      expect(fulfilledBadge).toBeInTheDocument();
      expect(fulfilledBadge).toHaveClass('bg-green-500/20');
      
      const pendingBadge = screen.getByText('Pending');
      expect(pendingBadge).toBeInTheDocument();
      expect(pendingBadge).toHaveClass('bg-yellow-500/20');
    });
  });

  it('renders the "Create Sale" button with the correct link', () => {
    render(<SalesPage />);
    const createSaleButton = screen.getByRole('link', { name: /create sale/i });
    expect(createSaleButton).toBeInTheDocument();
    expect(createSaleButton).toHaveAttribute('href', '/sales/new');
  });
});
