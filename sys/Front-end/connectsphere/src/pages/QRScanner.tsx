import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, User, Package, DollarSign, MapPin, Calendar, AlertTriangle, X } from 'lucide-react';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/Input';
import apiService from '../services/api';
import jsQR from 'jsqr';

interface QRScanResult {
  user_info: {
    id: number;
    email: string;
    full_name: string;
    location_zone?: string;
  };
  product_info: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
  };
  purchase_info: {
    group_buy_id: number;
    group_buy_name?: string;
    total_amount: number;
    purchase_date: string;
  };
  qr_status: {
    is_used: boolean;
    generated_at: string;
    expires_at: string;
    pickup_location: string;
    used_by_staff?: string;
    used_at?: string;
  };
}

export default function QRScanner() {
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setScanning(true);
    setError(null);
    setScanResult(null);
    setShowSuccess(false);

    try {
      // Call the backend API to scan QR code
      const result = await apiService.post('/api/admin/qr/scan', {
        qr_code_data: qrCode.trim()
      });

      setScanResult(result);

    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan QR code. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!scanResult) return;

    try {
      setScanning(true);
      
      // Mark QR as used - use the QR code ID, not the timestamp
      if (!scanResult.qr_status.id) {
        setError('QR code ID not found. Please scan again.');
        setScanning(false);
        return;
      }
      
      await apiService.post(`/api/admin/qr/mark-used/${scanResult.qr_status.id}`, {
        qr_code_data: qrCode
      });

      setShowSuccess(true);
      setError(null); // Clear any previous errors
      
      // Reset after 4 seconds (give more time to read)
      setTimeout(() => {
        setQrCode('');
        setScanResult(null);
        setShowSuccess(false);
      }, 4000);

    } catch (err: any) {
      setError(err.message || 'Failed to confirm pickup');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setQrCode('');
    setScanResult(null);
    setError(null);
    setShowSuccess(false);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      setError(null);
      setCameraActive(true); // Set immediately to show the video container
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      // Wait a tick to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        console.error('❌ Video element not found!');
        throw new Error('Video element not mounted');
      }
      
      const video = videoRef.current;
      
      video.onplaying = () => {
        setVideoReady(true);
      };
      
      video.onloadedmetadata = () => {
        setVideoReady(true);
      };
      
      // Assign the stream
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      
      // Try to play
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      // Verify video is working after a moment
      setTimeout(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoReady(true);
        }
      }, 1000);
      
      // Start scanning for QR codes
      scanIntervalRef.current = window.setInterval(() => {
        scanQRCode();
      }, 300); // Scan every 300ms
      
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += err.message || 'Please ensure camera permissions are granted.';
      }
      
      setCameraError(errorMessage);
      setCameraActive(false);
      setVideoReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setVideoReady(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    if (code) {
      setQrCode(code.data.toUpperCase());
      stopCamera();
      // Auto-scan the detected code
      setTimeout(() => {
        handleScanDetectedCode(code.data.toUpperCase());
      }, 100);
    }
  };

  const handleScanDetectedCode = async (detectedCode: string) => {
    if (!detectedCode.trim()) return;

    setScanning(true);
    setError(null);
    setScanResult(null);
    setShowSuccess(false);

    try {
      const result = await apiService.post('/api/admin/qr/scan', {
        qr_code_data: detectedCode.trim()
      });

      setScanResult(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan QR code. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="admin" />

      <PageContainer>
        <PageHeader
          title="QR Code Scanner"
          description="Scan trader QR codes for product pickup verification"
          breadcrumbs={[
            { label: 'Admin' },
            { label: 'QR Scanner' }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Camera className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Scan QR Code</h2>
                  <p className="text-sm text-gray-600">Enter the QR code from trader's device</p>
                </div>
              </div>

              {/* Camera View */}
              {cameraActive && (
                <div className="mb-4 relative rounded-lg overflow-hidden bg-gray-900" style={{ minHeight: '256px' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    autoPlay
                    muted
                    playsInline
                    style={{ 
                      minHeight: '256px',
                      maxHeight: '256px',
                      width: '100%',
                      backgroundColor: '#000',
                      display: 'block',
                      transform: 'scaleX(-1)' // Mirror the video horizontally
                    }}
                  />
                  
                  {/* Status indicator */}
                  {!videoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading camera...</p>
                        <p className="text-xs mt-1 text-gray-300">Check console (F12) if this persists</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug overlay - shows if video is loaded */}
                  {videoReady && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      ✓ Camera Active
                    </div>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-blue-500 w-48 h-48 rounded-lg opacity-75"></div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-white z-10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close Camera
                  </Button>
                  {videoReady && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
                      Position QR code within the frame
                    </div>
                  )}
                </div>
              )}

              {/* Hidden canvas for QR processing */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Camera Error */}
              {cameraError && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Camera Access Required</p>
                    <p className="text-sm text-yellow-700 mt-1">{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Camera Button */}
              {!cameraActive && (
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={startCamera}
                    disabled={scanning}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Use Camera to Scan
                  </Button>
                </div>
              )}

              {/* Divider */}
              {!cameraActive && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or enter manually</span>
                  </div>
                </div>
              )}

              {/* QR Input */}
              <div className="space-y-4">
                <Input
                  label="QR Code"
                  placeholder="QR-XXXXXXXX or paste scanned code"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                  disabled={scanning || cameraActive}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleScan();
                    }
                  }}
                />

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleScan}
                    disabled={scanning || !qrCode.trim() || cameraActive}
                    className="flex-1"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Scan QR Code
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={scanning}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Scan Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {showSuccess && (
                <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-lg flex items-start gap-3 animate-pulse">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-green-900">✅ Pickup Confirmed!</p>
                    <p className="text-base text-green-700 mt-1 font-medium">Product handed over successfully. Order marked as delivered.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Scan Result Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-600">Verify before confirming pickup</p>
                </div>
              </div>

              {showSuccess ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 mb-2">Success!</h3>
                  <p className="text-green-700 text-lg">Product handover completed</p>
                  <p className="text-gray-600 text-sm mt-2">Resetting scanner...</p>
                </div>
              ) : !scanResult ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Scan a QR code to see order details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR Status Alert - PROMINENT WARNING FOR USED CODES */}
                  {scanResult.qr_status.is_used ? (
                    <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-4 border-red-400 rounded-xl shadow-xl">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-500 rounded-full p-3">
                          <AlertTriangle className="h-8 w-8 text-white flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-red-900 mb-2">⚠️ ALREADY USED</h3>
                          <p className="text-lg text-red-800 font-semibold mb-3">
                            This QR code has already been scanned and marked as used!
                          </p>
                          <div className="bg-white/80 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Used on:</span>
                              <span className="text-red-700 font-bold">
                                {new Date(scanResult.qr_status.used_at!).toLocaleString()}
                              </span>
                            </div>
                            {scanResult.qr_status.used_by_staff && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Used by:</span>
                                <span className="text-red-700 font-bold">
                                  {scanResult.qr_status.used_by_staff}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-red-900 font-semibold mt-4 text-base">
                            ❌ Product has already been collected. Do not hand over again!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg flex items-start gap-3">
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-green-900">✅ Valid QR Code</p>
                        <p className="text-sm text-green-700 mt-1">
                          This code is valid and has not been used yet. Safe to proceed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{scanResult.user_info.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium text-gray-900">{scanResult.user_info.email}</span>
                      </div>
                      {scanResult.user_info.location_zone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Zone:</span>
                          <Badge variant="secondary">{scanResult.user_info.location_zone}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Product Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Product:</span>
                        <span className="text-sm font-medium text-gray-900">{scanResult.product_info.product_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="text-sm font-medium text-gray-900">{scanResult.product_info.quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Unit Price:</span>
                        <span className="text-sm font-medium text-gray-900">${scanResult.product_info.unit_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Purchase Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">
                          ${scanResult.purchase_info.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Purchase Date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(scanResult.purchase_info.purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                      {scanResult.purchase_info.group_buy_name && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Group Buy:</span>
                          <span className="text-sm font-medium text-gray-900">{scanResult.purchase_info.group_buy_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pickup Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Location
                    </h3>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-primary-900">{scanResult.qr_status.pickup_location}</p>
                    </div>
                  </div>

                  {/* Expiry Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Expires: {new Date(scanResult.qr_status.expires_at).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={scanResult.qr_status.is_used ? 'error' : 'success'}>
                      {scanResult.qr_status.is_used ? 'Used' : 'Valid'}
                    </Badge>
                  </div>

                  {/* Confirm Button - Show different button based on used status */}
                  {!scanResult.qr_status.is_used ? (
                    <Button
                      variant="primary"
                      onClick={handleConfirmPickup}
                      disabled={scanning}
                      className="w-full text-lg py-4"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Product Handover
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      disabled={true}
                      className="w-full text-lg py-4 cursor-not-allowed opacity-75"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Already Collected - Do Not Hand Over
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How to Use QR Scanner</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Ask for QR Code</h4>
                  <p className="text-sm text-gray-600">Ask the trader to show their QR code from their phone</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Scan with Camera</h4>
                  <p className="text-sm text-gray-600">Click "Use Camera to Scan" and point at the QR code, or enter manually</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Verify & Confirm</h4>
                  <p className="text-sm text-gray-600">Check details match and confirm product handover</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageContainer>

      <MobileBottomNav userRole="admin" />
    </div>
  );
}

