'use client';

import { useState, useEffect } from 'react';
import { BarcodeScannerService, BarcodeScanResult } from '@/lib/services/barcode.service';
import { Camera, Flashlight, FlipCameraIos, Close } from '@mui/icons-material';
import { IconButton, Dialog, DialogContent, DialogTitle, Alert, CircularProgress } from '@mui/material';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: BarcodeScanResult) => void;
  title?: string;
  formats?: string[];
}

export default function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = 'Scan Barcode',
  formats = ['EAN13', 'CODE128', 'QR'],
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      checkPermissions();
    } else {
      stopScanning();
    }
  }, [open]);

  const checkPermissions = async () => {
    try {
      const permissions = await BarcodeScannerService.checkPermissions();
      
      if (permissions.camera) {
        setHasPermission(true);
        startScanning();
      } else {
        // Request permissions
        const requested = await BarcodeScannerService.requestPermissions();
        
        if (requested.camera) {
          setHasPermission(true);
          startScanning();
        } else {
          setHasPermission(false);
          setError('Camera permission is required to scan barcodes');
        }
      }
    } catch (err) {
      setError('Failed to check camera permissions');
      console.error(err);
    }
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      await BarcodeScannerService.initScanner({
        formats,
        cameraFacing,
        showFlipCameraButton: true,
        showTorchButton: true,
        torchOn,
        prompt: 'Position barcode within the frame',
      });
      
      // Start continuous scanning
      scanLoop();
    } catch (err) {
      setError('Failed to start barcode scanner');
      console.error(err);
      setIsScanning(false);
    }
  };

  const scanLoop = async () => {
    if (!isScanning) return;
    
    try {
      const result = await BarcodeScannerService.scan({
        formats,
        cameraFacing,
        torchOn,
      });
      
      if (result) {
        // Success - notify parent
        onScan(result);
        stopScanning();
        onClose();
      } else {
        // No barcode detected, continue scanning
        setTimeout(scanLoop, 100);
      }
    } catch (err) {
      setError('Scanning error occurred');
      console.error(err);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    setIsScanning(false);
    
    try {
      await BarcodeScannerService.stopScanner();
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const flipCamera = () => {
    setCameraFacing(cameraFacing === 'back' ? 'front' : 'back');
    
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { backgroundColor: 'black' },
      }}
    >
      <DialogTitle
        sx={{
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Camera view would be rendered here by the scanning library */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          {hasPermission === null && (
            <>
              <CircularProgress sx={{ color: 'white', mb: 2 }} />
              <p style={{ color: 'white' }}>Checking camera permissions...</p>
            </>
          )}
          
          {hasPermission === false && (
            <Alert severity="error" sx={{ m: 2 }}>
              Camera permission is required to scan barcodes. Please enable camera access in your device settings.
            </Alert>
          )}
          
          {hasPermission && !isScanning && (
            <>
              <Camera sx={{ fontSize: 80, color: 'white', mb: 2 }} />
              <p style={{ color: 'white' }}>Starting camera...</p>
            </>
          )}
          
          {hasPermission && isScanning && (
            <>
              {/* Scanning frame overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  maxWidth: '400px',
                  height: '200px',
                  border: '2px solid #00ff00',
                  borderRadius: '8px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
              />
              
              <p
                style={{
                  position: 'absolute',
                  bottom: '150px',
                  color: 'white',
                  textAlign: 'center',
                  padding: '0 20px',
                }}
              >
                Position barcode within the frame
              </p>
            </>
          )}
          
          {error && (
            <Alert
              severity="error"
              sx={{
                position: 'absolute',
                top: 80,
                left: 20,
                right: 20,
              }}
            >
              {error}
            </Alert>
          )}
        </div>
        
        {/* Scanner controls */}
        {hasPermission && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
            }}
          >
            <IconButton
              onClick={toggleTorch}
              sx={{
                backgroundColor: torchOn ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                color: torchOn ? 'black' : 'white',
                '&:hover': {
                  backgroundColor: torchOn ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              <Flashlight />
            </IconButton>
            
            <IconButton
              onClick={flipCamera}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              <FlipCameraIos />
            </IconButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
