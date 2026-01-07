/**
 * Component Tests - Sales Order Form
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SalesOrderForm from "@/components/orders/SalesOrderForm";

// Mock fetch for customer and inventory lookups
global.fetch = jest.fn((url) => {
  if (url.includes("/api/customers")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            customers: [
              {
                id: "cust-1",
                name: "Test Customer",
                email: "test@example.com",
              },
            ],
          },
        }),
    });
  }

  if (url.includes("/api/inventory")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            items: [
              {
                id: "item-1",
                sku: "SKU-001",
                name: "Product 1",
                unitPrice: 9.99,
                stockLevel: { totalAvailable: 100 },
              },
            ],
          },
        }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
}) as jest.Mock;

describe("SalesOrderForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form fields", () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/order date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/required by/i)).toBeInTheDocument();
  });

  it("should load customers on mount", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/customers"),
        expect.any(Object),
      );
    });
  });

  it("should add line item", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/item/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit price/i)).toBeInTheDocument();
    });
  });

  it("should remove line item", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Add an item first
    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.queryByLabelText(/item/i)).not.toBeInTheDocument();
    });
  });

  it("should calculate line total", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const quantityInput = screen.getByLabelText(/quantity/i);
      const priceInput = screen.getByLabelText(/unit price/i);

      fireEvent.change(quantityInput, { target: { value: "10" } });
      fireEvent.change(priceInput, { target: { value: "9.99" } });
    });

    await waitFor(() => {
      expect(screen.getByText("£99.90")).toBeInTheDocument();
    });
  });

  it("should calculate order total", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Add first item
    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const quantityInputs = screen.getAllByLabelText(/quantity/i);
      const priceInputs = screen.getAllByLabelText(/unit price/i);

      fireEvent.change(quantityInputs[0], { target: { value: "10" } });
      fireEvent.change(priceInputs[0], { target: { value: "9.99" } });
    });

    // Add second item
    fireEvent.click(addButton);

    await waitFor(() => {
      const quantityInputs = screen.getAllByLabelText(/quantity/i);
      const priceInputs = screen.getAllByLabelText(/unit price/i);

      fireEvent.change(quantityInputs[1], { target: { value: "5" } });
      fireEvent.change(priceInputs[1], { target: { value: "19.99" } });
    });

    await waitFor(() => {
      // 10 * 9.99 + 5 * 19.99 = 99.90 + 99.95 = 199.85
      expect(screen.getByText(/total.*£199.85/i)).toBeInTheDocument();
    });
  });

  it("should validate required fields", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole("button", { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/customer is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should validate at least one line item", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Select customer
    const customerSelect = screen.getByLabelText(/customer/i);
    fireEvent.change(customerSelect, { target: { value: "cust-1" } });

    const submitButton = screen.getByRole("button", { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/at least one item is required/i),
      ).toBeInTheDocument();
    });
  });

  it("should submit valid form", async () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Select customer
    const customerSelect = screen.getByLabelText(/customer/i);
    fireEvent.change(customerSelect, { target: { value: "cust-1" } });

    // Add line item
    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const itemSelect = screen.getByLabelText(/item/i);
      const quantityInput = screen.getByLabelText(/quantity/i);

      fireEvent.change(itemSelect, { target: { value: "item-1" } });
      fireEvent.change(quantityInput, { target: { value: "10" } });
    });

    const submitButton = screen.getByRole("button", { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "cust-1",
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              inventoryItemId: "item-1",
              quantity: 10,
            }),
          ]),
        }),
      );
    });
  });

  it("should call onCancel when cancel clicked", () => {
    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should warn about low stock", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              items: [
                {
                  id: "item-1",
                  sku: "SKU-001",
                  name: "Low Stock Product",
                  stockLevel: { totalAvailable: 5 },
                },
              ],
            },
          }),
      }),
    );

    render(<SalesOrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const addButton = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      const itemSelect = screen.getByLabelText(/item/i);
      const quantityInput = screen.getByLabelText(/quantity/i);

      fireEvent.change(itemSelect, { target: { value: "item-1" } });
      fireEvent.change(quantityInput, { target: { value: "10" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/only 5 available/i)).toBeInTheDocument();
    });
  });
});
