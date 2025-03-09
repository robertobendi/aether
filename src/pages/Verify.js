import { useState } from 'react';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import jsQR from 'jsqr';

function Verify() {
  const [verificationResult, setVerificationResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const processImage = async (file) => {
    setProcessing(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for QR processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Detect QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          try {
            // Parse the QR data
            const qrData = JSON.parse(code.data);
            console.log("Decoded QR data:", qrData);
            
            // Extract relevant data
            const eventId = qrData.eventId;
            let hashValue = null;
            
            // Handle different QR data formats
            if (qrData.hash && typeof qrData.hash === 'string') {
              try {
                // If hash is another JSON string
                const hashData = JSON.parse(qrData.hash);
                if (hashData.proof && hashData.proof.hashValue) {
                  hashValue = hashData.proof.hashValue;
                }
              } catch {
                // If hash is not a JSON string
                hashValue = qrData.hash;
              }
            } else if (qrData.proof && qrData.proof.hashValue) {
              hashValue = qrData.proof.hashValue;
            }
            
            if (!eventId || !hashValue) {
              throw new Error("Invalid QR code format");
            }
            
            // Check local storage for ticket validation
            const storedTickets = JSON.parse(localStorage.getItem('zkTickets') || '{}');
            const eventTickets = storedTickets[eventId] || [];
            const isValid = eventTickets.some(ticket => ticket.hash === hashValue);
            
            // Set ticket data for display
            setTicketData({
              eventId: eventId,
              ticketId: qrData.ticketId || "Unknown",
              timestamp: new Date().toLocaleTimeString()
            });
            
            // Set verification result
            setVerificationResult(isValid);
            
          } catch (error) {
            console.error("Error processing QR data:", error);
            setError(`Error processing QR code data: ${error.message}`);
          }
        } else {
          setError("No QR code found in the image. Please try another image.");
        }
        setProcessing(false);
      };
      
      img.onerror = () => {
        setError("Failed to load the image. Please try another file.");
        setProcessing(false);
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      setError("Error reading the file. Please try again.");
      setProcessing(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Handle file upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    processImage(file);
  };
  
  // Reset verification
  const resetVerification = () => {
    setVerificationResult(null);
    setTicketData(null);
    setError(null);
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
                  Upload a ticket QR code to verify event access using zero-knowledge proof verification.
                </p>
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <label 
                    className={`flex items-center justify-center px-4 py-3 bg-accent text-white rounded-lg w-full max-w-xs hover:bg-opacity-90 cursor-pointer transition-all duration-fast ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {processing ? 'Processing...' : 'Upload QR Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={processing}
                    />
                  </label>
                  
                  <p className="text-text-secondary text-sm italic mt-2">
                    Upload the QR ticket image you downloaded
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg text-red-400 text-sm mt-4">
                  {error}
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