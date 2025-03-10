import { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Upload, Camera, X, Calendar, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';
import AnimatedBackground from '../components/AnimatedBackground';
import { useToast } from '../components/Toast';
import { processQRData, isMinaAvailable } from '../utils/zkUtils';

function Verify() {
  const { addToast } = useToast();
  const [verificationResult, setVerificationResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hashDetails, setHashDetails] = useState(null);
  const [minaStatus, setMinaStatus] = useState(null);
  
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

  // Check Mina availability on component mount
  useEffect(() => {
    const checkMina = async () => {
      try {
        const available = await isMinaAvailable();
        setMinaStatus(available);
        if (available) {
          addToast("Mina Protocol connected successfully", "SUCCESS");
        } else {
          addToast("Using local verification (Mina unavailable)", "INFO");
        }
      } catch (error) {
        console.error("Error checking Mina:", error);
        setMinaStatus(false);
      }
    };
    
    checkMina();
    
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
      addToast("Initializing camera for QR scanning...", "INFO");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationRef.current = requestAnimationFrame(scanQRCode);
        addToast("Camera active - position QR code in frame", "INFO");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(`Camera access error: ${err.message}. Try uploading an image instead.`);
      addToast(`Camera error: ${err.message}`, "ERROR");
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
          addToast("QR code detected!", "SUCCESS");
          
          // Process the QR code with async handling
          handleQRData(code.data);
          return;
        }
      } catch (e) {
        console.error("QR scanning error:", e);
      }
    }
    
    // Continue scanning
    requestAnimationRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleQRData = async (data) => {
    try {
      setProcessing(true);
      addToast("Processing cryptographic data...", "INFO");
      
      // Use our Mina-enabled processQRData function from zkUtils
      const result = await processQRData(data);
      
      if (!result) {
        throw new Error("Failed to process ticket data");
      }
      
      const { isValid, eventId, ticketId, hashValue, protocol = "mina-poseidon" } = result;
      
      if (!eventId) {
        throw new Error("Invalid ticket: missing event ID");
      }
      
      // Set hash details for display
      setHashDetails({
        value: hashValue.length > 32 
          ? hashValue.substring(0, 16) + '...' + hashValue.substring(hashValue.length - 16)
          : hashValue,
        algorithm: protocol || "mina-poseidon",
        timestamp: new Date().toLocaleString()
      });
      
      // Get event information
      const event = eventsDB[eventId];
      
      // Set ticket data for display
      setTicketData({
        eventId: eventId,
        ticketId: ticketId || "Unknown",
        timestamp: new Date().toLocaleTimeString(),
        seat: "General Admission", // Default value
        ticketType: "Standard" // Default value
      });
      
      // Set event info
      if (event) {
        setEventInfo(event);
      }
      
      // Set verification result
      setVerificationResult(isValid);
      
      // Show result toast
      if (isValid) {
        addToast(`✅ Ticket verified using ${minaStatus ? 'Mina Protocol' : 'local verification'}!`, "SUCCESS", 5000);
      } else {
        addToast("❌ Invalid ticket detected", "ERROR", 5000);
      }
      
    } catch (error) {
      console.error("Error processing QR data:", error);
      setError(`Error processing QR code data: ${error.message}`);
      addToast(`Verification failed: ${error.message}`, "ERROR");
    } finally {
      setProcessing(false);
    }
  };

  const processImage = (file) => {
    setProcessing(true);
    setError(null);
    addToast("Processing uploaded image...", "INFO");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        addToast("Scanning image for QR code...", "INFO");
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
          addToast("QR code detected in image", "SUCCESS");
          // Process with async handling
          handleQRData(code.data);
        } else {
          setError("No QR code found in the image. Please try another image.");
          addToast("No QR code found in image", "ERROR");
          setProcessing(false);
        }
      };
      
      img.onerror = () => {
        setError("Failed to load the image. Please try another file.");
        addToast("Failed to load image", "ERROR");
        setProcessing(false);
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      setError("Error reading the file. Please try again.");
      addToast("Error reading file", "ERROR");
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
    setHashDetails(null);
    setError(null);
    stopCamera();
    addToast("Verification reset", "INFO");
  };

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground />
      
      <div className="relative max-w-xl mx-auto p-4 md:p-8 lg:p-12">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-accent to-blue-600">
          Verify Ticket
        </h1>
        
        {/* Mina status indicator */}
        <div className={`mb-4 rounded-lg p-2 px-4 text-sm inline-flex items-center ${minaStatus ? 'bg-green-900 bg-opacity-20 text-green-400' : 'bg-yellow-900 bg-opacity-20 text-yellow-400'}`}>
          <div className={`h-2 w-2 rounded-full mr-2 ${minaStatus ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          {minaStatus 
            ? 'Powered by Mina Protocol ZK Proofs' 
            : 'Using local verification mode'}
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border-primary shadow-lg">
          {!ticketData && !verificationResult && (
            <>
              <div className="text-center mb-8">
                <p className="text-text-secondary mb-6">
                  Scan a ticket QR code to verify event access using {minaStatus ? 'zero-knowledge proofs.' : 'cryptographic verification.'}
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
                    <span>The QR code contains a {minaStatus ? 'zero-knowledge proof' : 'cryptographic proof'} that verifies ticket authenticity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>No personal data is revealed during verification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>Verification happens entirely on your device {minaStatus && '- secured by Mina Protocol'}</span>
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
                    {minaStatus && <p className="text-green-300 text-sm mt-2">Validated with Mina Protocol</p>}
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
              
              {/* Cryptographic Details */}
              {hashDetails && (
                <div className="mb-6 bg-blue-900 bg-opacity-10 p-4 rounded-xl border border-blue-700 text-blue-300">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    {minaStatus ? 'Zero-Knowledge Proof' : 'Cryptographic Verification'}
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Hash:</span>
                      <span className="font-mono">{hashDetails.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span>{hashDetails.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span>{hashDetails.timestamp}</span>
                    </div>
                    {minaStatus && (
                      <div className="mt-2 text-xs bg-blue-900 bg-opacity-20 p-2 rounded">
                        This hash is verified using Mina Protocol's Poseidon hash function, specially designed for zero-knowledge proofs
                      </div>
                    )}
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