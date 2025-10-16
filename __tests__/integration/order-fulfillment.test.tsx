/**
 * Integration Tests - Order Fulfillment Workflow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderFulfillmentPage from '@/app/(dashboard)/orders/sales/[id]/fulfill/page';
import { mockPrisma } from '@/lib/test-utils/api-test-utils';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'order-1',
  }),
}));

describe('Integration: Order Fulfillment Workflow', () => {
  const mockOrder = {
    id: 'order-1',
    soNumber: 'SO-20240115-001',
    status: 'CONFIRMED',
    customer: {
      name: 'Test Customer',
      email: 'customer@example.com',
    },
    lineItems: [
      {
        id: 'line-1',
        inventoryItem: {
          id: 'item-1',
          sku: 'SKU-001',
          name: 'Product 1',
        },
        quantity: 10,
        pickedQuantity: 0,
      },
    ],
    warehouse: {
      id: 'wh-1',
      name: 'Main Warehouse',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/orders/sales/order-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockOrder,
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }) as jest.Mock;
  });

  it('should complete full order fulfillment workflow', async () => {
    render(<OrderFulfillmentPage />);

    // Step 1: Load order details
    await waitFor(() => {
      expect(screen.getByText('SO-20240115-001')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Step 2: Generate wave
    const generateWaveButton = screen.getByRole('button', { name: /generate wave/i });
    fireEvent.click(generateWaveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/waves'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Step 3: Assign tasks
    await waitFor(() => {
      const assignButton = screen.getByRole('button', { name: /assign tasks/i });
      fireEvent.click(assignButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/assign'),
        expect.any(Object)
      );
    });

    // Step 4: Simulate picking
    const pickButton = screen.getByRole('button', { name: /start picking/i });
    fireEvent.click(pickButton);

    const quantityInput = screen.getByLabelText(/picked quantity/i);
    fireEvent.change(quantityInput, { target: { value: '10' } });

    const confirmPickButton = screen.getByRole('button', { name: /confirm pick/i });
    fireEvent.click(confirmPickButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"pickedQuantity":10'),
        })
      );
    });

    // Step 5: Complete packing
    await waitFor(() => {
      const packButton = screen.getByRole('button', { name: /pack order/i });
      fireEvent.click(packButton);
    });

    const boxCountInput = screen.getByLabelText(/number of boxes/i);
    fireEvent.change(boxCountInput, { target: { value: '1' } });

    const confirmPackButton = screen.getByRole('button', { name: /confirm packing/i });
    fireEvent.click(confirmPackButton);

    // Step 6: Generate shipping label
    await waitFor(() => {
      const shipButton = screen.getByRole('button', { name: /generate label/i });
      fireEvent.click(shipButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shipping/label'),
        expect.any(Object)
      );
    });

    // Step 7: Complete shipment
    const completeButton = screen.getByRole('button', { name: /complete shipment/i });
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/sales/order-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"status":"SHIPPED"'),
        })
      );
    });

    // Verify order marked as shipped
    await waitFor(() => {
      expect(screen.getByText(/order shipped successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle partial picking', async () => {
    render(<OrderFulfillmentPage />);

    await waitFor(() => {
      expect(screen.getByText('SO-20240115-001')).toBeInTheDocument();
    });

    const pickButton = screen.getByRole('button', { name: /start picking/i });
    fireEvent.click(pickButton);

    // Pick only 5 out of 10
    const quantityInput = screen.getByLabelText(/picked quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    const confirmPickButton = screen.getByRole('button', { name: /confirm pick/i });
    fireEvent.click(confirmPickButton);

    await waitFor(() => {
      expect(screen.getByText(/partially picked/i)).toBeInTheDocument();
    });

    // Should show backorder option
    expect(screen.getByRole('button', { name: /create backorder/i })).toBeInTheDocument();
  });

  it('should handle stock shortage during picking', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Insufficient stock available',
        }),
      })
    );

    render(<OrderFulfillmentPage />);

    await waitFor(() => {
      const pickButton = screen.getByRole('button', { name: /start picking/i });
      fireEvent.click(pickButton);
    });

    const quantityInput = screen.getByLabelText(/picked quantity/i);
    fireEvent.change(quantityInput, { target: { value: '10' } });

    const confirmPickButton = screen.getByRole('button', { name: /confirm pick/i });
    fireEvent.click(confirmPickButton);

    await waitFor(() => {
      expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument();
    });
  });

  it('should allow order cancellation', async () => {
    render(<OrderFulfillmentPage />);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel order/i });
      fireEvent.click(cancelButton);
    });

    // Confirm cancellation
    const confirmCancelButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmCancelButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/sales/order-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"status":"CANCELLED"'),
        })
      );
    });
  });
});
