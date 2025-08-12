
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewSalePage from '@/app/sales/new/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Counterparty, type Product, type SalesOrder } from '@prisma/client';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getCounterparties: jest.fn(),
  getProducts: jest.fn(),
  createSalesOrder: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockGetCounterparties = actions.getCounterparties as jest.Mock;
const mockGetProducts = actions.getProducts as jest.Mock;
const mockCreateSalesOrder = actions.createSalesOrder as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockClients: Counterparty[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
];
const mockProducts: Product[] = [
  { id: 'p1', name: 'Ergo-Comfort Keyboard', sku: 'KB-4532', category: 'Electronics', stock: 10, price: 79.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', name: 'HD Webcam 1080p', sku: 'WC-1080', category: 'Electronics', stock: 20, price: 49.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('NewSalePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCounterparties.mockResolvedValue(mockClients);
    mockGetProducts.mockResolvedValue(mockProducts);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the page and initial form elements', async () => {
    render(<NewSalePage />);
    expect(screen.getByRole('heading', { name: /create new sale/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Select a client')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create sales order/i })).toBeDisabled();
  });

  it('allows selecting a client', async () => {
    render(<NewSalePage />);
    const user = userEvent.setup();

    const clientSelect = await screen.findByRole('combobox');
    await user.click(clientSelect);
    
    const clientOption = await screen.findByText('Innovate Inc.');
    await user.click(clientOption);

    expect(await screen.findByText('Innovate Inc.')).toBeInTheDocument();
  });

  it('allows adding and removing line items', async () => {
    render(<NewSalePage />);
    const user = userEvent.setup();

    const addItemButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addItemButton);
    
    expect(screen.getByRole('button', { name: 'Select product...' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header, Item Row, Footer

    await user.click(addItemButton);
    expect(screen.getAllByRole('row')).toHaveLength(4); // Header, 2 Item Rows, Footer
    
    const removeButtons = screen.getAllByRole('button', { name: /trash2/i });
    await user.click(removeButtons[0]);

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('populates line item details when a product is selected', async () => {
    render(<NewSalePage />);
    const user = userEvent.setup();
    
    await user.click(screen.getByRole('button', { name: /add item/i }));

    const productSelector = screen.getByRole('button', { name: 'Select product...' });
    await user.click(productSelector);

    const productOption = await screen.findByText(/Ergo-Comfort Keyboard/);
    await user.click(productOption);

    // Using findBy queries to wait for state updates
    const quantityInput = await screen.findByDisplayValue('1');
    const priceInput = await screen.findByDisplayValue('79.99');
    
    expect(quantityInput).toBeInTheDocument();
    expect(priceInput).toBeInTheDocument();
    expect(await screen.findByText('$79.99')).toBeInTheDocument();
  });
  
  it('calculates subtotal, tax, and total correctly', async () => {
    render(<NewSalePage />);
    const user = userEvent.setup();
    
    // Add first item
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.click(screen.getByRole('button', { name: /select product/i }));
    await user.click(await screen.findByText(/Ergo-Comfort Keyboard/)); // 79.99

    // Add second item
    await user.click(screen.getByRole('button', { name: /add item/i }));
    // The previously added item now shows its name, so the new one is 'Select product...'
    const productSelectors = screen.getAllByRole('button', { name: /select product/i });
    await user.click(productSelectors[productSelectors.length - 1]);
    await user.click(await screen.findByText(/HD Webcam 1080p/)); // 49.99

    // Subtotal = 79.99 + 49.99 = 129.98
    // Tax = 129.98 * 0.1 = 12.998
    // Total = 129.98 + 12.998 = 142.978
    
    expect(screen.getByText('$129.98')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$13.00')).toBeInTheDocument(); // tax (rounded)
    expect(screen.getByText('$142.98')).toBeInTheDocument(); // total (rounded)
  });

  it('successfully creates a sales order and redirects', async () => {
    const newOrder: SalesOrder = { id: 'so-new', orderNumber: 'SO-123456', counterpartyId: '1', orderDate: new Date(), status: 'Pending', subtotal: 79.99, tax: 8, total: 87.99, createdAt: new Date(), updatedAt: new Date() };
    mockCreateSalesOrder.mockResolvedValue({ success: true, data: newOrder });

    render(<NewSalePage />);
    const user = userEvent.setup();

    // Select client
    await user.click(await screen.findByRole('combobox'));
    await user.click(await screen.findByText('Innovate Inc.'));

    // Add product
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.click(screen.getByRole('button', { name: /select product/i }));
    await user.click(await screen.findByText(/Ergo-Comfort Keyboard/));

    const createButton = screen.getByRole('button', { name: /create sales order/i });
    expect(createButton).toBeEnabled();
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockCreateSalesOrder).toHaveBeenCalledWith({
        counterpartyId: '1',
        orderDate: expect.any(Date),
        items: [{
          productId: 'p1',
          quantity: 1,
          unitPrice: 79.99,
        }],
      });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sales Order Created',
        description: `Order ${newOrder.orderNumber} has been successfully created.`,
      });
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/sales');
    });
  });

  it('shows an error if sales order creation fails', async () => {
     mockCreateSalesOrder.mockResolvedValue({ success: false, error: 'Out of stock.' });

     render(<NewSalePage />);
     const user = userEvent.setup();
 
     // Select client
     await user.click(await screen.findByRole('combobox'));
     await user.click(await screen.findByText('Innovate Inc.'));
 
     // Add product
     await user.click(screen.getByRole('button', { name: /add item/i }));
     await user.click(screen.getByRole('button', { name: /select product/i }));
     await user.click(await screen.findByText(/Ergo-Comfort Keyboard/));

     await user.click(screen.getByRole('button', { name: /create sales order/i }));
    
     await waitFor(() => {
       expect(mockToast).toHaveBeenCalledWith({
         title: 'Error',
         description: 'Out of stock.',
         variant: 'destructive',
       });
     });
  });

});
