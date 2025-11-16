import { RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

const QRVerification = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // QR Code helper functions
  const handleQRScan = async (qrCodeData: string) => {
    if (!qrCodeData) return;

    setErrorMessage('');

    try {
      // Always fetch fresh data from the server to avoid cache issues
      const result = await apiService.scanQRCode(qrCodeData);
      setScanResult(result);
      setLastScannedCode(qrCodeData);

      // Add to scan history locally for immediate feedback
      const scanEntry = {
        qrCode: qrCodeData,
        timestamp: new Date(),
        userInfo: result.user_info,
        productInfo: result.product_info,
        purchaseInfo: result.purchase_info
      };
      setScanHistory(prev => [scanEntry, ...prev].slice(0, 50)); // Keep last 50 scans

      // Refresh scan history from API to get the latest data
      try {
        const history = await apiService.getQRScanHistory(50, 0);
        const transformedHistory = history.scans.map((scan: any) => ({
          qrCode: scan.qr_code,
          timestamp: new Date(scan.scanned_at),
          userInfo: scan.user_info,
          productInfo: scan.product_info,
          purchaseInfo: scan.purchase_info
        }));
        setScanHistory(transformedHistory);
      } catch (refreshError) {
        console.error('Failed to refresh scan history:', refreshError);
        // Keep the local update if API refresh fails
      }
    } catch (error: any) {
      console.error('QR Scan Error Details:', error);

      // Extract detailed error message
      let errorDetail = error.message || 'Failed to scan QR code';

      // Add timestamp for admin reference
      const timestamp = new Date().toLocaleString();
      const fullErrorMessage = `${errorDetail}\n\nTime: ${timestamp}\nQR Code: ${qrCodeData?.substring(0, 20)}...`;

      setErrorMessage(fullErrorMessage);
      setScanResult(null);
    }
  };

  // Function to refresh the current scan result with fresh data from database
  const refreshScanResult = async () => {
    if (lastScannedCode) {
      console.log('Refreshing scan result with fresh data...');
      await handleQRScan(lastScannedCode);
    }
  };

  // QR Scanner functions
  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setErrorMessage('');
      setScanResult(null);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          handleQRScan(result.data);
          stopScanning();
        },
        {
          onDecodeError: (error) => {
            console.log('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = scanner;
      await scanner.start();
    } catch (error: any) {
      console.error('Failed to start QR scanner:', error);
      setErrorMessage('Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Load QR scan history on mount
  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const history = await apiService.getQRScanHistory(50, 0);
        // Transform API response to match current scanHistory format
        const transformedHistory = history.scans.map((scan: any) => ({
          qrCode: scan.qr_code,
          timestamp: new Date(scan.scanned_at),
          userInfo: scan.user_info,
          productInfo: scan.product_info,
          purchaseInfo: scan.purchase_info
        }));
        setScanHistory(transformedHistory);
      } catch (error) {
        console.error('Failed to load scan history:', error);
        // Don't show error to user, just log it
      }
    };

    loadScanHistory();
  }, []);

  return (
    <Layout title="QR Verification">
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4">
            {/* Main Layout - Camera and Instructions/Results */}
            <div className={`grid gap-6 ${scanResult || !scanResult ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>

              {/* Camera Section - Always on left */}
              <div className="space-y-3">
                {/* QR Scanner */}
                <div className="aspect-square w-64 mx-auto relative bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-1 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10l4.553-2.276A1 1 0 0119 8.618v6.764a1 1 0 01-1.447.894L13 14M3 18h8a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-900 font-medium text-sm">Camera Ready</p>
                          <p className="text-xs text-gray-600 mt-0.5">Click "Start Scanning" to activate the camera</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium transition-colors ${
                      isScanning
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                  </button>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setErrorMessage('');
                      setLastScannedCode(null);
                    }}
                    className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Last Scanned Code */}
                {lastScannedCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Last scanned:</span> {lastScannedCode.substring(0, 20)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Instructions, Errors, or Results */}
              <div className="space-y-4">
                {/* Error Message - Show whenever there's an error */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-800 font-semibold text-base">QR Scan Error</p>
                    </div>
                    <div className="text-red-700 bg-red-100 px-3 py-2 rounded-md border border-red-200 whitespace-pre-line">
                      {errorMessage}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-red-600">Try scanning again or ask the customer for a new QR code.</p>
                      <button
                        onClick={() => setErrorMessage('')}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Clear Error
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions - Show when no scan result and no error */}
                {!scanResult && !errorMessage && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">How it works:</h3>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                        <span>Click "Start Scanning" to activate the camera</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                        <span>Point the camera at a customer's QR code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                        <span>The system will automatically scan and verify the QR code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                        <span>Review the customer and purchase information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                        <span>Complete the pickup process and mark the QR code as used</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Scan Results - Show when there's a successful scan result */}
                {scanResult && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-green-800 font-semibold text-base">QR Code Verified Successfully!</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {/* User Info */}
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Customer Information
                          </h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{scanResult.user_info?.full_name || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-900">{scanResult.user_info?.email || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Location:</span> <span className="text-gray-900">{scanResult.user_info?.location_zone || 'N/A'}</span></p>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Product Information
                          </h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium text-gray-600">Product:</span> <span className="text-gray-900">{scanResult.product_info?.name || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Price:</span> <span className="text-gray-900">${scanResult.product_info?.unit_price || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Category:</span> <span className="text-gray-900">{scanResult.product_info?.category || 'N/A'}</span></p>
                          </div>
                        </div>

                        {/* Purchase Info */}
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Purchase Details
                          </h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium text-gray-600">Quantity:</span> <span className="text-gray-900">{scanResult.purchase_info?.quantity || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Amount:</span> <span className="text-gray-900">${scanResult.purchase_info?.amount || 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Date:</span> <span className="text-gray-900">{scanResult.purchase_info?.purchase_date ? new Date(scanResult.purchase_info.purchase_date).toLocaleDateString() : 'N/A'}</span></p>
                          </div>
                        </div>

                        {/* QR Status */}
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01" />
                            </svg>
                            QR Code Status
                          </h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium text-gray-600">Used:</span> <span className={`font-medium ${scanResult.qr_status?.is_used ? 'text-red-600' : 'text-green-600'}`}>{scanResult.qr_status?.is_used ? 'Yes' : 'No'}</span></p>
                            <p><span className="font-medium text-gray-600">Generated:</span> <span className="text-gray-900">{scanResult.qr_status?.generated_at ? new Date(scanResult.qr_status.generated_at).toLocaleDateString() : 'N/A'}</span></p>
                            <p><span className="font-medium text-gray-600">Expires:</span> <span className="text-gray-900">{scanResult.qr_status?.expires_at ? new Date(scanResult.qr_status.expires_at).toLocaleDateString() : 'N/A'}</span></p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={refreshScanResult}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Refresh Status
                            </button>
                            {!scanResult.qr_status?.is_used && (
                              <button
                                onClick={async () => {
                                  try {
                                    console.log('QR Status:', scanResult.qr_status);
                                    console.log('QR ID:', scanResult.qr_status?.id);

                                    if (!scanResult.qr_status?.id) {
                                      throw new Error('QR Code ID is missing from scan result');
                                    }

                                    await apiService.markQRCodeAsUsed(scanResult.qr_status.id);
                                    // Refresh the scan result to show updated status
                                    await refreshScanResult();
                                    // Refresh scan history
                                    const history = await apiService.getQRScanHistory(50, 0);
                                    const transformedHistory = history.scans.map((scan: any) => ({
                                      qrCode: scan.qr_code,
                                      timestamp: new Date(scan.scanned_at),
                                      userInfo: scan.user_info,
                                      productInfo: scan.product_info,
                                      purchaseInfo: scan.purchase_info
                                    }));
                                    setScanHistory(transformedHistory);
                                  } catch (error: any) {
                                    setErrorMessage(error.message || 'Failed to mark QR code as used');
                                  }
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-md font-medium transition-colors"
                              >
                                Mark as Used
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scan History - Always visible */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Scan History:</h4>
                  {scanHistory.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {scanHistory.map((scan, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-xs font-medium text-gray-900">
                                {scan.userInfo?.full_name || 'Unknown User'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {scan.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <p><span className="font-medium">Product:</span> {scan.productInfo?.name || 'N/A'}</p>
                            <p><span className="font-medium">Email:</span> {scan.userInfo?.email || 'N/A'}</p>
                            <p><span className="font-medium">Scanned:</span> {scan.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs">No QR scans recorded yet</p>
                      <p className="text-xs mt-1">Scanned QR codes will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QRVerification;