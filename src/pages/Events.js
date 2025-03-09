import { useState, useEffect, useRef } from 'react';
import { CalendarDays, MapPin, Clock, X, Download, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { generateTicketProof, storeTicketHash, isMinaAvailable } from '../utils/zkUtils';
import websiteInfo from '../utils/websiteInfo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useToast } from '../components/Toast';

function Events() {
  const { addToast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: ''
  });
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [ticketHash, setTicketHash] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [minaStatus, setMinaStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Add ref to track if we've shown the toast
  const minaToastShown = useRef(false);

  // Check Mina availability on component mount
  useEffect(() => {
    const checkMina = async () => {
      try {
        const available = await isMinaAvailable();
        setMinaStatus(available);
        
        // Only show toast once using ref
        if (available && !minaToastShown.current) {
          addToast("Mina Protocol connected successfully", "SUCCESS");
          minaToastShown.current = true;
        }
      } catch (error) {
        console.error("Error checking Mina:", error);
        setMinaStatus(false);
      }
    };
    
    checkMina();
  }, []); // Remove addToast from dependencies array

  // Sample event data
  const events = [
    {
      id: 'evt-001',
      title: 'Web3 Developer Conference',
      date: 'March 15, 2025',
      time: '9:00 AM - 5:00 PM',
      location: 'Tech Hub, San Francisco',
      description: 'Join the leading Web3 developers for a day of workshops, talks, and networking opportunities.',
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=2070',
      price: 'Free'
    },
    {
      id: 'evt-002',
      title: 'Zero Knowledge Summit',
      date: 'April 2, 2025',
      time: '10:00 AM - 6:00 PM',
      location: 'Crypto Center, New York',
      description: 'Explore the latest advancements in zero-knowledge proofs and their applications in privacy-preserving technologies.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032',
      price: 'Free'
    },
    {
      id: 'evt-003',
      title: 'Blockchain Art Festival',
      date: 'April 10, 2025',
      time: '12:00 PM - 8:00 PM',
      location: 'Digital Gallery, Miami',
      description: 'Experience the intersection of blockchain technology and art with interactive installations and NFT showcases.',
      image: 'https://images.unsplash.com/photo-1551503766-ac63dfa6401c?q=80&w=2670',
      price: 'Free'
    }
  ];

  const handleBuyTicket = (event) => {
    setSelectedEvent(event);
    setShowTicketModal(true);
  };

  const handleCloseModal = () => {
    setShowTicketModal(false);
    setTicketGenerated(false);
    setFormData({
      email: '',
      name: '',
      phone: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Generate a ticket ID
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    try {
      // Show starting process toast
      addToast(`Starting ${minaStatus ? 'zero-knowledge' : 'cryptographic'} ticket generation...`, "INFO");
      
      // Generate cryptographic proof
      if (minaStatus) {
        addToast("Creating Mina Protocol zero-knowledge proof...", "INFO");
      } else {
        addToast("Hashing your private information securely...", "INFO");
      }
      
      const zkProof = await generateTicketProof(
        selectedEvent.id,
        formData.email,
        formData.name,
        ticketId
      );
      
      // Store the hash
      if (zkProof.demoProof.protocol === 'mina-poseidon') {
        addToast("Zero-knowledge proof generated successfully!", "SUCCESS");
      } else {
        addToast("Cryptographic proof generated successfully!", "SUCCESS");
      }
      
      // Save the ticket ID for display
      setTicketHash(ticketId);
      
      // Generate QR code with the proof data
      addToast("Creating secure QR code...", "INFO");
      const qrData = JSON.stringify({
        eventId: selectedEvent.id,
        ticketId: ticketId,
        // Include ZK proof data
        proof: zkProof.demoProof,
        leafIndex: zkProof.demoProof.leafIndex
      });
      
      // Log the proof details for demonstration
      console.log('Generated cryptographic ticket proof:', zkProof);
      
      // Generate QR code
      await generateQRCode(qrData);
      
      // Show the ticket download section
      setTicketGenerated(true);
      const proofType = minaStatus ? 'zero-knowledge' : 'cryptographic';
      addToast(`Your secure ticket with ${proofType} proof is ready!`, "SUCCESS", 5000);
    } catch (error) {
      console.error("Error generating ticket:", error);
      addToast(`Error: ${error.message}`, "ERROR", 5000);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateQRCode = async (hashData) => {
    try {
      // Create a JSON object with ticket data
      const ticketData = JSON.stringify({
        eventId: selectedEvent.id,
        hash: hashData,
        timestamp: Date.now()
      });
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(ticketData);
      setQrCodeUrl(qrDataUrl);
      addToast("QR code generated successfully", "SUCCESS");
    } catch (err) {
      console.error("Error generating QR code:", err);
      addToast(`Error generating QR code: ${err.message}`, "ERROR");
    }
  };

  const handleDownloadTicket = () => {
    try {
      // Create a download link for the QR code
      const downloadLink = document.createElement('a');
      downloadLink.href = qrCodeUrl;
      downloadLink.download = `aether-ticket-${selectedEvent.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      addToast("Ticket downloaded successfully!", "SUCCESS");
      
      // Close the modal after download
      setTimeout(() => {
        handleCloseModal();
      }, 500);
    } catch (err) {
      addToast(`Error downloading ticket: ${err.message}`, "ERROR");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Add animated background */}
      <AnimatedBackground />
      
      <div className="relative max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
        <h1 className="text-3xl font-semibold mb-4 text-text-primary">
          Upcoming Events
        </h1>

        {/* Mina status indicator */}
        {minaStatus !== null && (
          <div className={`mb-8 rounded-lg p-2 px-4 text-sm inline-flex items-center ${minaStatus ? 'bg-green-900 bg-opacity-20 text-green-400' : 'bg-yellow-900 bg-opacity-20 text-yellow-400'}`}>
            <div className={`h-2 w-2 rounded-full mr-2 ${minaStatus ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            {minaStatus 
              ? 'Tickets are secured with Mina Protocol zero-knowledge proofs' 
              : 'Using cryptographic verification'}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-surface rounded-lg overflow-hidden shadow-lg border border-border-primary">
              <div className="h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2 text-text-primary">{event.title}</h2>
                
                <div className="mb-4 text-text-secondary text-sm">
                  <div className="flex items-center mb-1">
                    <CalendarDays className="w-4 h-4 mr-2 text-text-accent" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <Clock className="w-4 h-4 mr-2 text-text-accent" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-text-accent" />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <p className="text-text-secondary mb-4 text-sm line-clamp-3">
                  {event.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-text-accent font-medium">{event.price}</span>
                  <button 
                    onClick={() => handleBuyTicket(event)}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-fast"
                  >
                    Get Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Purchase Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
          <div className="bg-surface border border-border-primary rounded-lg shadow-lg max-w-md w-full animate-fade-in">
            <div className="flex justify-between items-center p-5 border-b border-border-primary">
              <h3 className="text-xl font-semibold text-text-primary">
                {ticketGenerated ? 'Your Ticket is Ready' : 'Get Your Ticket'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              {!ticketGenerated ? (
                <>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-text-primary mb-1">
                      {selectedEvent.title}
                    </h4>
                    <p className="text-text-secondary text-sm">
                      {selectedEvent.date} • {selectedEvent.time}
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-text-secondary text-sm mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 bg-background border border-border-primary rounded text-text-primary"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-text-secondary text-sm mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 bg-background border border-border-primary rounded text-text-primary"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-text-secondary text-sm mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 bg-background border border-border-primary rounded text-text-primary"
                      />
                    </div>
                    
                    <div className="p-4 bg-background rounded-lg mb-6 text-sm text-text-secondary">
                      <div className="flex items-start mb-2">
                        <ShieldCheck className="w-5 h-5 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-accent mb-1">Your privacy is protected</p>
                          <p>Your personal details will never leave your browser. {minaStatus 
                            ? 'A zero-knowledge proof will be used for verification via Mina Protocol.' 
                            : 'A secure cryptographic hash will be used for verification.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-fast disabled:opacity-50 flex items-center justify-center"
                    >
                      {isGenerating ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Generating...
                        </>
                      ) : (
                        `Generate ${minaStatus ? 'ZK Ticket' : 'Ticket'}`
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-6 p-6 bg-background rounded-lg border-2 border-accent border-dashed">
                    <div className="text-lg font-medium text-text-primary mb-2">
                      {selectedEvent.title}
                    </div>
                    <div className="text-text-secondary text-sm mb-4">
                      {selectedEvent.date} • {selectedEvent.time}
                    </div>
                    <div className="text-text-secondary mb-4">
                      <div>Attendee: {formData.name}</div>
                      <div>Ticket ID: {ticketHash}</div>
                    </div>
                    
                    {qrCodeUrl && (
                      <div className="flex justify-center mb-4">
                        <img src={qrCodeUrl} alt="Ticket QR Code" className="w-48 h-48" />
                      </div>
                    )}
                    
                    {minaStatus && (
                      <div className="text-xs bg-blue-900 bg-opacity-20 p-2 rounded text-blue-300">
                        Secured with Mina Protocol zero-knowledge proofs
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleDownloadTicket}
                    className="inline-flex items-center justify-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-fast"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Ticket
                  </button>
                  
                  <p className="mt-4 text-sm text-text-secondary">
                    Your ticket includes a {minaStatus ? 'zero-knowledge proof' : 'cryptographic proof'} that can be verified without revealing your personal information. Present the QR code at the event for verification.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;