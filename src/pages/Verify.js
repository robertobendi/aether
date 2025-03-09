import { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Upload, Camera, X, Calendar, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';
import AnimatedBackground from '../components/AnimatedBackground';

function Verify() {
  const [verificationResult, setVerificationResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestAnimationRef = useRef(null);

  // Mock event database
  const eventsDB = {
    'evt-001': {
      title: 'Web3 Developer Conference',
      date: 'March 15, 2025',
      time: '9:00 AM - 5:00 PM',
      location: 'Tech Hub, San Francisco',
      attendees: 850,
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=2070'
    },
    'evt-002': {
      title: 'Zero Knowledge Summit',
      date: 'April 2, 2025',
      time: '10:00 AM - 6:00 PM',
      location: 'Crypto Center, New York',
      attendees: 1200,
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032'
    },
    'evt-003': {
      title: 'Blockchain Art Festival',
      date: 'April 10, 2025',
      time: '12:00 PM - 8:00 PM',
      location: 'Digital Gallery, Miami',
      attendees: 650,
      image: 'https://images.unsplash.com/photo-1551503766-ac63dfa6401c?q=80&w=2670'
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on component unmount
      stopCamera();
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationRef.current = requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(`Camera access error: ${err.message}. Try uploading an image instead.`);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      requestAnimationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Stop scanning
          stopCamera();
          
          // Process the QR code
          processQRData(code.data);
          return;
        }
      } catch (e) {
        console.error("QR scanning error:", e);
      }
    }
    
    // Continue scanning
    requestAnimationRef.current = requestAnimationFrame(scanQRCode);
  };

  const processQRData = (data) => {
    try {
      // Parse the QR data
      const qrData = JSON.parse(data);
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
      const storedTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
      const eventTickets = storedTickets[eventId] || [];
      const isValid = eventTickets.some(ticket => ticket.hash === hashValue);
      
      // Get event information
      const event = eventsDB[eventId];
      
      // Set ticket data for display
      setTicketData({
        eventId: eventId,
        ticketId: qrData.ticketId || "Unknown",
        timestamp: new Date().toLocaleTimeString(),
        seat: qrData.seat || "General Admission",
        ticketType: qrData.ticketType || "Standard"
      });
      
      // Set event info
      if (event) {
        setEventInfo(event);
      }
      
      // Set verification result
      setVerificationResult(isValid);
      
    } catch (error) {
      console.error("Error processing QR data:", error);
      setError(`Error processing QR code data: ${error.message}`);
    }
  };

  const processImage = (file) => {
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
          processQRData(code.data);
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
    setEventInfo(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground />
      
      <div className="relative max-w-xl mx-auto p-4 md:p-8 lg:p-12">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-accent to-blue-600">
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
                    <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-sm mx-auto mb-4 aspect-square">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        playsInline
                      />
                      <canvas 
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full opacity-0"
                      />
                      <div className="absolute inset-0 border-4 border-accent opacity-50 m-10 pointer-events-none animate-pulse rounded-lg"></div>
                    </div>
                    <button
                      onClick={stopCamera}
                      className="flex items-center justify-center px-4 py-2 bg-surface text-text-primary border border-border-primary rounded-lg hover:bg-opacity-90 transition-all duration-DEFAULT"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Scanning
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <button 
                      onClick={startCamera}
                      disabled={processing}
                      className="flex items-center justify-center px-4 py-3 bg-accent text-white rounded-lg w-full max-w-xs hover:bg-opacity-90 transition-all duration-DEFAULT disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Scan with Camera
                    </button>
                    
                    <div className="flex items-center justify-center w-full my-4">
                      <div className="border-t border-border-primary w-full"></div>
                      <span className="px-3 text-text-secondary text-sm">OR</span>
                      <div className="border-t border-border-primary w-full"></div>
                    </div>
                    
                    <label 
                      className={`flex items-center justify-center px-4 py-3 bg-surface text-text-primary border border-border-primary rounded-lg w-full max-w-xs hover:bg-opacity-90 cursor-pointer transition-all duration-DEFAULT ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload QR Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={processing}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg text-red-400 text-sm mt-4 animate-pulse">
                  {error}
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-border-primary">
                <h3 className="text-lg font-medium text-text-primary mb-3">How it works</h3>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>The QR code contains a zero-knowledge proof that verifies ticket authenticity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>No personal data is revealed during verification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>Verification happens entirely on your device - no server connection needed</span>
                  </li>
                </ul>
              </div>
            </>
          )}
          
          {ticketData && verificationResult !== null && (
            <div>
              {/* Verification Result Banner */}
              <div className={`text-center p-6 mb-6 rounded-xl ${verificationResult ? 'bg-green-900 bg-opacity-20 border border-green-700' : 'bg-red-900 bg-opacity-20 border border-red-700'}`}>
                {verificationResult ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-yellow-300 opacity-75 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Ticket Valid</h2>
                    <p className="text-text-secondary">This ticket is authentic and valid for entry.</p>
                  </div>
                ) : (
                  <div>
                    <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Invalid Ticket</h2>
                    <p className="text-text-secondary">This ticket could not be verified.</p>
                  </div>
                )}
              </div>
              
              {/* Event Information (if available) */}
              {eventInfo && (
                <div className="mb-6 bg-background rounded-xl overflow-hidden border border-border-primary">
                  <div className="h-32 overflow-hidden relative">
                    <img 
                      src={eventInfo.image} 
                      alt={eventInfo.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-xl font-bold text-white">{eventInfo.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-accent" />
                        <span className="text-text-secondary text-sm">{eventInfo.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-accent" />
                        <span className="text-text-secondary text-sm">{eventInfo.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-accent" />
                        <span className="text-text-secondary text-sm">{eventInfo.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-accent" />
                        <span className="text-text-secondary text-sm">{eventInfo.attendees} attendees</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Ticket Details */}
              <div className="bg-background p-4 rounded-xl border border-border-primary mb-6">
                <h3 className="text-lg font-medium text-text-primary mb-3">Ticket Details</h3>
                <div className="text-left text-text-secondary text-sm space-y-2">
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Ticket ID:</span>
                    <span className="font-mono">{ticketData.ticketId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Event ID:</span>
                    <span className="font-mono">{ticketData.eventId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Seat/Section:</span>
                    <span>{ticketData.seat}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-primary">
                    <span>Ticket Type:</span>
                    <span>{ticketData.ticketType}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Verification Time:</span>
                    <span>{ticketData.timestamp}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={resetVerification}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-DEFAULT"
                >
                  Verify Another Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Verify;