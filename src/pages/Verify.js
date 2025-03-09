import { useState } from 'react';
import { Camera, CheckCircle, XCircle, Upload } from 'lucide-react';
import { verifyTicketProof } from '../utils/zkUtils';

function Verify() {
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Simulated QR code scanning
  const handleScan = async () => {
    setScanError(null);
    setScanning(true);
    
    // Simulate the scanning process
    setTimeout(async () => {
      try {
        // In a real app, this would be the result of scanning a QR code
        // Here we simulate finding a valid ticket in localStorage
        const storedTickets = JSON.parse(localStorage.getItem('zkTickets') || '{}');
        const eventIds = Object.keys(storedTickets);
        
        if (eventIds.length === 0) {
          throw new Error("No tickets found. Please purchase a ticket first.");
        }
        
        // Get a random event and its first ticket
        const eventId = eventIds[0];
        const ticket = storedTickets[eventId][0];
        
        // Simulate the ticket data from QR code
        const simulatedTicketData = {
          eventId: eventId,
          ticketId: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          proof: {
            hashValue: ticket.hash,
            timestamp: ticket.timestamp
          }
        };
        
        setTicketData(simulatedTicketData);
        
        // Verify the ZK proof
        const isValid = await verifyTicketProof(
          JSON.stringify({ test: 'simulated-proof' }),  // In real app, this would be from QR code
          JSON.stringify(['public', 'inputs'])         // In real app, this would be from QR code
        );
        
        setVerificationResult(isValid);
      } catch (error) {
        console.error("Scan error:", error);
        setScanError(error.message);
      } finally {
        setScanning(false);
      }
    }, 2000); // Simulate 2-second scanning time
  };
  
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // In a real implementation, this would parse the QR code from the image
        // Here we're just simulating a successful scan
        await handleScan();
      } catch (error) {
        setScanError("Failed to read QR code from image.");
      }
    };
    reader.readAsDataURL(file);
  };
  
  const resetVerification = () => {
    setVerificationResult(null);
    setTicketData(null);
    setScanError(null);
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
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <button 
                    onClick={handleScan}
                    disabled={scanning}
                    className="flex items-center justify-center px-4 py-3 bg-accent text-white rounded-lg w-full max-w-xs hover:bg-opacity-90 transition-all duration-fast disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {scanning ? "Scanning..." : "Scan QR Code"}
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
                    <span>{new Date().toLocaleTimeString()}</span>
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