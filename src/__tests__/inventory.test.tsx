
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryPage from '@/app/inventory/page';
import * as actions from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Product } from '@prisma/client';

// Mock the server actions
jest.mock('@/lib/actions', () => ({
  __esModule: true,
  getProducts: jest.fn(),
  createProduct: jest.fn(),
  exportToCsv: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));


const mockGetProducts = actions.getProducts as jest.Mock;
const mockCreateProduct = actions.createProduct as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockProducts: Product[] = [
  { id: '1', name: 'Ergo-Comfort Keyboard', sku: 'KB-4532', category: 'Electronics', stock: 120, price: 79.99, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'HD Webcam 1080p', sku: 'WC-1080', category: 'Electronics', stock: 85, price: 49.99, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
];

describe('InventoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProducts.mockResolvedValue(mockProducts);
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('renders the inventory page with initial products', async () => {
    render(<InventoryPage />);
    
    expect(screen.getByRole('heading', { name: /inventory/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Ergo-Comfort Keyboard')).toBeInTheDocument();
      expect(screen.getByText('HD Webcam 1080p')).toBeInTheDocument();
    });
  });

  it('allows searching for a product', async () => {
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Ergo-Comfort Keyboard')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search products...');
    await userEvent.type(searchInput, 'Webcam');

    expect(screen.getByText('HD Webcam 1080p')).toBeInTheDocument();
    expect(screen.queryByText('Ergo-Comfort Keyboard')).not.toBeInTheDocument();
  });

  it('opens the add product sheet and validates the form', async () => {
    render(<InventoryPage />);
    const user = userEvent.setup();

    const addProductButton = screen.getByRole('button', { name: /add product/i });
    await user.click(addProductButton);

    const saveButton = screen.getByRole('button', { name: /save product/i });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText(/product name/i), 'New Gadget');
    await user.type(screen.getByLabelText(/sku/i), 'NG-001');
    
    const stockInput = screen.getByLabelText(/stock quantity/i);
    await user.clear(stockInput);
    await user.type(stockInput, '50');
    
    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, 'invalid-price');

    expect(saveButton).toBeDisabled();
    expect(await screen.findByText('Price must be a positive number.')).toBeInTheDocument();
    
    await user.clear(priceInput);
    await user.type(priceInput, '199');

    expect(saveButton).toBeEnabled();
  });

  it('successfully creates a new product and closes the sheet', async () => {
    const newProduct: Product = { id: '3', name: 'New Gadget', sku: 'NG-001', category: 'Gadgets', stock: 50, price: 199, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() };
    mockCreateProduct.mockResolvedValue({ success: true, data: newProduct });
    
    render(<InventoryPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add product/i }));

    await user.type(screen.getByLabelText(/product name/i), newProduct.name);
    await user.type(screen.getByLabelText(/sku/i), newProduct.sku);
    
    const stockInput = screen.getByLabelText(/stock quantity/i);
    await user.clear(stockInput);
    await user.type(stockInput, newProduct.stock.toString());

    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, newProduct.price.toString());
    await user.type(screen.getByLabelText(/category/i), newProduct.category as string);

    await user.click(screen.getByRole('button', { name: /save product/i }));

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: newProduct.name,
        sku: newProduct.sku,
        stock: newProduct.stock,
        price: newProduct.price,
        category: newProduct.category,
        imageUrl: "https://placehold.co/100x100.png"
      });
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Product Saved',
        description: `${newProduct.name} has been successfully added.`,
      });
    });

    await waitFor(() => {
        // The mockGetProducts needs to be called again by the hook to refresh data
        expect(mockGetProducts).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByRole('heading', { name: /add new product/i })).not.toBeInTheDocument();
  });

  it('shows an error toast if product creation fails', async () => {
    mockCreateProduct.mockResolvedValue({ success: false, error: "SKU already exists" });

    render(<InventoryPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add product/i }));
    
    await user.type(screen.getByLabelText(/product name/i), 'Fail Product');
    await user.type(screen.getByLabelText(/sku/i), 'FAIL-01');
    const stockInput = screen.getByLabelText(/stock quantity/i);
    await user.clear(stockInput);
    await user.type(stockInput, '10');
    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, '10');

    await user.click(screen.getByRole('button', { name: /save product/i }));

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            title: "Error",
            description: "SKU already exists",
            variant: "destructive",
        });
    });
  });
});
