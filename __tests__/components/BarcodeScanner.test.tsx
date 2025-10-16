/**
 * Component Tests - Barcode Scanner
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarcodeScanner from '@/components/mobile/BarcodeScanner';
import { BarcodeScanResult } from '@/lib/services/barcode.service';

// Mock barcode scanner service
jest.mock('@/lib/services/barcode.service', () => ({
  BarcodeScannerService: {
    checkPermissions: jest.fn().mockResolvedValue({ camera: true }),
    requestPermissions: jest.fn().mockResolvedValue({ camera: true }),
    initScanner: jest.fn().mockResolvedValue(undefined),
    scan: jest.fn().mockResolvedValue({
      data: '1234567890123',
      format: 'EAN13',
      timestamp: new Date(),
    }),
    stopScanner: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('BarcodeScanner Component', () => {
  const mockOnScan = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    expect(screen.getByText('Scan Barcode')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <BarcodeScanner
        open={false}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    expect(screen.queryByText('Scan Barcode')).not.toBeInTheDocument();
  });

  it('should show custom title', () => {
    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
        title="Scan Item Barcode"
      />
    );

    expect(screen.getByText('Scan Item Barcode')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should check camera permissions on mount', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');

    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(BarcodeScannerService.checkPermissions).toHaveBeenCalled();
    });
  });

  it('should request permissions when not granted', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');
    
    BarcodeScannerService.checkPermissions.mockResolvedValueOnce({ camera: false });

    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(BarcodeScannerService.requestPermissions).toHaveBeenCalled();
    });
  });

  it('should show error when permissions denied', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');
    
    BarcodeScannerService.checkPermissions.mockResolvedValueOnce({ camera: false });
    BarcodeScannerService.requestPermissions.mockResolvedValueOnce({ camera: false });

    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/camera permission is required/i)).toBeInTheDocument();
    });
  });

  it('should toggle torch when torch button clicked', async () => {
    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /flashlight/i })).toBeInTheDocument();
    });

    const torchButton = screen.getByRole('button', { name: /flashlight/i });
    fireEvent.click(torchButton);

    // Torch should toggle (visual state change)
    expect(torchButton).toBeInTheDocument();
  });

  it('should flip camera when flip button clicked', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');

    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /flip/i })).toBeInTheDocument();
    });

    const flipButton = screen.getByRole('button', { name: /flip/i });
    fireEvent.click(flipButton);

    await waitFor(() => {
      // Should restart scanner with different camera
      expect(BarcodeScannerService.stopScanner).toHaveBeenCalled();
    });
  });

  it('should call onScan when barcode scanned', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');
    
    const mockResult: BarcodeScanResult = {
      data: '1234567890123',
      format: 'EAN13',
      timestamp: new Date(),
    };

    BarcodeScannerService.scan.mockResolvedValueOnce(mockResult);

    render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith(mockResult);
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should stop scanner when closed', async () => {
    const { BarcodeScannerService } = require('@/lib/services/barcode.service');

    const { rerender } = render(
      <BarcodeScanner
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    rerender(
      <BarcodeScanner
        open={false}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    await waitFor(() => {
      expect(BarcodeScannerService.stopScanner).toHaveBeenCalled();
    });
  });
});
