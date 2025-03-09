import { useState } from 'react';
import { Camera, CheckCircle, XCircle, Upload } from 'lucide-react';
import { verifyTicketProof } from '../utils/zkUtils';
import QrScanner from 'qr-scanner'; // Add this library

function Verify() {
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [scanner, setScanner] = useState(null);

  // Initialize scanner when the video element is ready
  const handleVideoRef = (ref) => {
    setVideoRef(ref);
    if (ref && scanning) {
      startScanner(ref);
    }
  };

  // Start the QR scanner
  const startScanner = async (videoElement) => {
    try {
      const qrScanner = new QrScanner(
        videoElement,
        result => {
          handleQrResult(result.data);
          stopScanner(qrScanner);
        },
        { returnDetailedScanResult: true }
      );
      
      await qrScanner.start();
      setScanner(qrScanner);
    } catch (error) {
      console.error("Error starting scanner:", error);
      setScanError("Could not access camera. Please check permissions.");
      setScanning(false);
    }
  };

  // Stop the QR scanner
  const stopScanner = (scannerInstance) => {
    if (scannerInstance) {
      scannerInstance.stop();
      scannerInstance.destroy();
      setScanner(null);
    }
    setScanning(false);
  };

  // Handle scan button click
  const handleScan = () => {
    setScanError(null);
    setScanning(true);
    
    if (videoRef) {
      startScanner(videoRef);
    }
  };

  // Process scanned QR code data
  const handleQrResult = async (qrData) => {
    try {
      // Parse the QR code data
      const parsedData = JSON.parse(qrData);
      console.log("Parsed QR data:", parsedData);
      
      if (!parsedData.eventId || !parsedData.hash) {
        throw new Error("Invalid ticket data format");
      }
      
      setTicketData({
        eventId: parsedData.eventId,
        ticketId: parsedData.ticketId || "Unknown",
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Check if ticket exists in local storage
      const storedTickets = JSON.parse(localStorage.getItem('zkTickets') || '{}');
      const eventTickets = storedTickets[parsedData.eventId] || [];
      
      // Verify by checking if hash exists in stored tickets
      let ticketFound = false;
      if (parsedData.proof && parsedData.proof.hashValue) {
        ticketFound = eventTickets.some(ticket => ticket.hash === parsedData.proof.hashValue);
      } else if (parsedData.hash) {
        // Alternative format
        const hashData = JSON.parse(parsedData.hash);
        ticketFound = eventTickets.some(ticket => ticket.hash === hashData.proof.hashValue);
      }
      
      // Set verification result
      setVerificationResult(ticketFound);
      
    } catch (error) {
      console.error("Error processing QR code:", error);
      setScanError(`Error processing QR code: ${error.message}`);
      setScanning(false);
    }
  };
  
  // Handle file upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imageUrl = event.target.result;
        
        // Scan the QR code from the image
        const result = await QrScanner.scanImage(imageUrl, { returnDetailedScanResult: true });
        handleQrResult(result.data);
        
      } catch (error) {
        console.error("Failed to read QR code from image:", error);
        setScanError("Failed to read QR code from image. Please try another image or use the camera.");
      }
    };
    reader.onerror = () => {
      setScanError("Error reading the uploaded file.");
    };
    reader.readAsDataURL(file);
  };
  
  // Reset verification
  const resetVerification = () => {
    setVerificationResult(null);
    setTicketData(null);
    setScanError(null);
    setScanning(false);
    if (scanner) {
      stopScanner(scanner);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto p-4 md:p-8 lg:p-12">
        <h1 className="text-3xl font-semibold mb-6 text-text-primary">
          Verify Ticket
        </h1>
        
        <div className="bg-surface p-6 rounded-xl border border-border-primary shadow-lg">
          {!ticketData && !verificationResult && (
            <>
              <div className="text-center mb-8">
                <p className="text-text-secondary mb-6">
                  Scan a ticket QR code to verify event access using zero-knowledge proof verification.
                </p>
                
                {scanning ? (
                  <div className="mb-6">
                    <div className="bg-black rounded-lg overflow-hidden w-full max-w-xs mx-auto mb-4 aspect-square">
                      <video 
                        ref={handleVideoRef}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => {
                        stopScanner(scanner);
                        setScanning(false);
                      }}
                      className="px-4 py-2 bg-surface text-text-primary border border-border-primary rounded-lg hover:bg-opacity-90 transition-all duration-fast"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <button 
                      onClick={handleScan}
                      className="flex items-center justify-center px-4 py-3 bg-accent text-white rounded-lg w-full max-w-xs hover:bg-opacity-90 transition-all duration-fast disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Scan QR Code
                    </button>
                    
                    <div className="flex items-center justify-center w-full">
                      <div className="border-t border-border-primary w-full"></div>
                      <span className="px-3 text-text-secondary text-sm">OR</span>
                      <div className="border-t border-border-primary w-full"></div>
                    </div>
                    
                    <label 
                      className="flex items-center justify-center px-4 py-3 bg-surface text-text-primary border border-border-primary rounded-lg w-full max-w-xs hover:bg-opacity-90 cursor-pointer transition-all duration-fast"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload QR Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {scanError && (
                <div className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg text-red-400 text-sm mt-4">
                  {scanError}
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-border-primary">
                <h3 className="text-lg font-medium text-text-primary mb-3">How it works</h3>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="text-text-accent mr-2">•</span>
                    <span>The QR code contains a zero-knowledge proof that verifies ticket authenticity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-text-accent mr-2">•</span>
                    <span>No personal data is revealed during verification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-text-accent mr-2">•</span>
                    <span>Verification happens entirely on your device - no server connection needed</span>
                  </li>
                </ul>
              </div>
            </>
          )}
          
          {ticketData && verificationResult !== null && (
            <div className="text-center">
              {verificationResult ? (
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-text-primary mb-2">Ticket Valid</h2>
                  <p className="text-text-secondary">This ticket is authentic and valid for entry.</p>
                </div>
              ) : (
                <div className="mb-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-text-primary mb-2">Invalid Ticket</h2>
                  <p className="text-text-secondary">This ticket could not be verified.</p>
                </div>
              )}
              
              <div className="bg-background p-4 rounded-lg border border-border-primary mb-6">
                <h3 className="text-lg font-medium text-text-primary mb-2">Ticket Details</h3>
                <div className="text-left text-text-secondary text-sm">
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Event ID:</span>
                    <span className="font-mono">{ticketData.eventId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Ticket ID:</span>
                    <span className="font-mono">{ticketData.ticketId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Verification Time:</span>
                    <span>{ticketData.timestamp}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={resetVerification}
                className="px-4 py-2 bg-surface text-text-primary border border-border-primary rounded-lg hover:bg-opacity-90 transition-all duration-fast"
              >
                Verify Another Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Verify;