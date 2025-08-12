
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewPurchasePage from '@/app/purchases/new/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Counterparty, type Product, type PurchaseOrder } from '@prisma/client';

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
  createPurchaseOrder: jest.fn(),
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
const mockCreatePurchaseOrder = actions.createPurchaseOrder as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockVendors: Counterparty[] = [
  { id: '1', name: 'Vendor A', email: 'contact@vendora.com', phone: '123-456-7890', address: '123 Tech Ave', types: ['VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];
const mockProducts: Product[] = [
  { id: 'p1', name: 'Ergo-Comfort Keyboard', sku: 'KB-4532', category: 'Electronics', stock: 10, price: 79.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', name: 'HD Webcam 1080p', sku: 'WC-1080', category: 'Electronics', stock: 20, price: 49.99, imageUrl: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('NewPurchasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCounterparties.mockResolvedValue(mockVendors);
    mockGetProducts.mockResolvedValue(mockProducts);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the page and initial form elements', async () => {
    render(<NewPurchasePage />);
    expect(screen.getByRole('heading', { name: /create new purchase/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Select a vendor')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create purchase order/i })).toBeDisabled();
  });

  it('allows adding and populating line items', async () => {
    render(<NewPurchasePage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add item/i }));
    
    const productSelector = screen.getByRole('button', { name: 'Select product...' });
    await user.click(productSelector);

    const productOption = await screen.findByText(/Ergo-Comfort Keyboard/);
    await user.click(productOption);

    const quantityInput = await screen.findByDisplayValue('1');
    const priceInput = await screen.findByDisplayValue('79.99');
    
    expect(quantityInput).toBeInTheDocument();
    expect(priceInput).toBeInTheDocument();
    expect(await screen.findByText('$79.99')).toBeInTheDocument();
  });
  
  it('successfully creates a purchase order and redirects', async () => {
    const newOrder: PurchaseOrder = { id: 'po-new', orderNumber: 'PO-123456', counterpartyId: '1', orderDate: new Date(), status: 'Pending', subtotal: 79.99, tax: 8, total: 87.99, createdAt: new Date(), updatedAt: new Date() };
    mockCreatePurchaseOrder.mockResolvedValue({ success: true, data: newOrder });

    render(<NewPurchasePage />);
    const user = userEvent.setup();

    // Select vendor
    const vendorSelect = await screen.findByRole('combobox');
    await user.click(vendorSelect);
    const vendorOption = await screen.findByText('Vendor A');
    await user.click(vendorOption);

    // Add product
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.click(screen.getByRole('button', { name: /select product/i }));
    await user.click(await screen.findByText(/Ergo-Comfort Keyboard/));

    const createButton = screen.getByRole('button', { name: /create purchase order/i });
    expect(createButton).toBeEnabled();
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockCreatePurchaseOrder).toHaveBeenCalledWith({
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
        title: 'Purchase Order Created',
        description: `Order ${newOrder.orderNumber} has been successfully created.`,
      });
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/purchases');
    });
  });

  it('shows an error if purchase order creation fails', async () => {
     mockCreatePurchaseOrder.mockResolvedValue({ success: false, error: 'Invalid vendor.' });

     render(<NewPurchasePage />);
     const user = userEvent.setup();
 
     // Select vendor and add product
     const vendorSelect = await screen.findByRole('combobox');
     await user.click(vendorSelect);
     await user.click(await screen.findByText('Vendor A'));
     await user.click(screen.getByRole('button', { name: /add item/i }));
     await user.click(screen.getByRole('button', { name: /select product/i }));
     await user.click(await screen.findByText(/Ergo-Comfort Keyboard/));

     await user.click(screen.getByRole('button', { name: /create purchase order/i }));
    
     await waitFor(() => {
       expect(mockToast).toHaveBeenCalledWith({
         title: 'Error',
         description: 'Invalid vendor.',
         variant: 'destructive',
       });
     });
  });
});
