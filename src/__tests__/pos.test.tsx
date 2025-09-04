
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PosPage from '@/app/pos/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Product, type SalesOrder } from '@prisma/client';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
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

const mockGetProducts = actions.getProducts as jest.Mock;
const mockCreateSalesOrder = actions.createSalesOrder as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockProducts: Product[] = [
  { id: 'p1', name: 'Ergo-Comfort Keyboard', sku: 'KB-4532', category: 'Electronics', stock: 10, price: 79.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', name: 'HD Webcam 1080p', sku: 'WC-1080', category: 'Electronics', stock: 20, price: 49.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', name: 'Premium Coffee Beans (1kg)', sku: 'CF-001', category: 'Office Supplies', stock: 0, price: 22.00, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('PosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProducts.mockResolvedValue(mockProducts);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders products and displays "Out of Stock" overlay', async () => {
    render(<PosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Ergo-Comfort Keyboard')).toBeInTheDocument();
      expect(screen.getByText('HD Webcam 1080p')).toBeInTheDocument();
    });

    // Check for "Out of Stock" item
    expect(screen.getByText('Premium Coffee Beans (1kg)')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('adds items to the cart and updates totals', async () => {
    render(<PosPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    });

    // Find and click the keyboard product card
    const keyboardCard = await screen.findByText('Ergo-Comfort Keyboard');
    await user.click(keyboardCard);

    // Verify cart contents
    expect(await screen.findByText('Ergo-Comfort Keyboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeEnabled();

    // Verify totals (Subtotal: 79.99, Tax: 16.00, Total: 95.99)
    // Note: JS floating point math can be tricky, so we check for the rounded result.
    // 79.99 * 0.20 = 15.998
    expect(screen.getByText('$79.99')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$16.00')).toBeInTheDocument(); // tax
    expect(screen.getByText('$95.99')).toBeInTheDocument(); // total
  });

  it('cannot add an out-of-stock item to the cart', async () => {
    render(<PosPage />);
    const user = userEvent.setup();

    await waitFor(() => {});

    const coffeeCard = screen.getByText('Premium Coffee Beans (1kg)');
    await user.click(coffeeCard);

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('updates item quantity in the cart', async () => {
     render(<PosPage />);
     const user = userEvent.setup();

     await user.click(await screen.findByText('Ergo-Comfort Keyboard'));

     const plusButton = screen.getByRole('button', { name: /plus/i });
     await user.click(plusButton);

     expect(screen.getByText('2')).toBeInTheDocument();

     // Verify totals (Subtotal: 159.98, Tax: 32.00, Total: 191.98)
     expect(screen.getByText('$159.98')).toBeInTheDocument();
     expect(screen.getByText('$32.00')).toBeInTheDocument();
     expect(screen.getByText('$191.98')).toBeInTheDocument();
  });

  it('removes an item from the cart', async () => {
    render(<PosPage />);
    const user = userEvent.setup();
    
    await user.click(await screen.findByText('Ergo-Comfort Keyboard'));
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();

    const trashButton = screen.getByRole('button', { name: /trash2/i });
    await user.click(trashButton);

    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('completes a sale and clears the cart', async () => {
    const newOrder: SalesOrder = { id: 'so-pos', orderNumber: 'SO-POS-123', counterpartyId: '1', orderDate: new Date(), status: 'Pending', subtotal: 79.99, tax: 16, total: 95.99, generateInvoice: false, createdAt: new Date(), updatedAt: new Date() };
    mockCreateSalesOrder.mockResolvedValue({ success: true, data: newOrder });
    mockGetProducts.mockResolvedValue(mockProducts); // Mock the refetch

    render(<PosPage />);
    const user = userEvent.setup();
    
    // Add item to cart
    await user.click(await screen.findByText('Ergo-Comfort Keyboard'));

    // Open checkout
    await user.click(screen.getByRole('button', { name: /checkout/i }));
    
    // Confirm payment
    const confirmButton = await screen.findByRole('button', { name: /confirm payment/i });
    await user.click(confirmButton);

    // Assertions
    await waitFor(() => {
        expect(mockCreateSalesOrder).toHaveBeenCalledWith({
            counterpartyId: "1", // The hardcoded POS client ID
            orderDate: expect.any(Date),
            generateInvoice: false,
            items: [{
                productId: 'p1',
                quantity: 1,
                unitPrice: 79.99,
            }],
        });
    });

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Sale Complete',
            description: `Order ${newOrder.orderNumber} has been created.`,
        });
    });

    // Cart should be empty and products refetched
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    expect(mockGetProducts).toHaveBeenCalledTimes(2); // Initial fetch + refetch on success
  });

});
