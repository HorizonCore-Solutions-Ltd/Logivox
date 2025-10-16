/**
 * Component Tests - Inventory List
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryList from '@/components/inventory/InventoryList';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: {
        items: [
          {
            id: '1',
            sku: 'SKU-001',
            name: 'Test Product',
            description: 'A test product',
            category: { name: 'Electronics' },
            unitPrice: 99.99,
            stockLevel: { totalAvailable: 100 },
            reorderPoint: 20,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    }),
  })
) as jest.Mock;

describe('InventoryList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render inventory items', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should show pagination info', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText(/1 of 1/i)).toBeInTheDocument();
    });
  });

  it('should filter by search term', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Test' } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Test'),
        expect.any(Object)
      );
    }, { timeout: 1500 }); // Debounce delay
  });

  it('should filter by category', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=cat-1'),
        expect.any(Object)
      );
    });
  });

  it('should sort by SKU ascending', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/sort/i);
      fireEvent.change(sortSelect, { target: { value: 'sku' } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=sku'),
        expect.any(Object)
      );
    });
  });

  it('should toggle sort order', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      const orderButton = screen.getByRole('button', { name: /order/i });
      fireEvent.click(orderButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=desc'),
        expect.any(Object)
      );
    });
  });

  it('should navigate to next page', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          items: [],
          total: 20,
          page: 1,
          limit: 10,
        },
      }),
    });

    render(<InventoryList />);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('should show stock level badge', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('should show low stock warning', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          items: [
            {
              id: '1',
              sku: 'SKU-LOW',
              name: 'Low Stock Item',
              stockLevel: { totalAvailable: 10 },
              reorderPoint: 20,
            },
          ],
          total: 1,
        },
      }),
    });

    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText(/low stock/i)).toBeInTheDocument();
    });
  });

  it('should open edit dialog', async () => {
    render(<InventoryList />);

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/edit inventory/i)).toBeInTheDocument();
    });
  });

  it('should export to CSV', async () => {
    const mockDownload = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    HTMLAnchorElement.prototype.click = mockDownload;

    render(<InventoryList />);

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalled();
    });
  });

  it('should handle loading state', () => {
    render(<InventoryList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should show empty state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          items: [],
          total: 0,
        },
      }),
    });

    render(<InventoryList />);

    await waitFor(() => {
      expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
  });
});
