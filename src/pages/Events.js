import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Clock, X, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { generateTicketProof, storeTicketHash } from '../utils/zkUtils';
import websiteInfo from '../utils/websiteInfo';
import AnimatedBackground from '../components/AnimatedBackground';

function Events() {
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
    
    // Generate a ticket ID
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    try {
      // Generate actual ZK proof
      const zkProof = await generateTicketProof(
        selectedEvent.id,
        formData.email,
        formData.name,
        ticketId
      );
      
      // Store the hash in local storage (simulated Merkle tree)
      storeTicketHash(zkProof.demoProof.hashValue, selectedEvent.id);
      
      // Save the hash for display
      setTicketHash(ticketId);
      
      // Generate QR code with the proof data
      const qrData = JSON.stringify({
        eventId: selectedEvent.id,
        ticketId: ticketId,
        // Include ZK proof data (only demo proof for display)
        proof: zkProof.demoProof
      });
      
      // Generate QR code
      generateQRCode(qrData);
      
      console.log('Generated ZK ticket proof:', zkProof);
      
      // Show the ticket download section
      setTicketGenerated(true);
    } catch (error) {
      console.error("Error generating ticket:", error);
      alert("There was an error generating your ticket. Please try again.");
    }
  };
  
  const generateQRCode = async (hashData) => {
    try {
      // Create a JSON object with ticket data (this would be the ZK proof in production)
      const ticketData = JSON.stringify({
        eventId: selectedEvent.id,
        hash: hashData,
        timestamp: Date.now()
      });
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(ticketData);
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const handleDownloadTicket = () => {
    // In a real implementation, this would:
    // 1. Generate a downloadable ticket with embedded ZK proof
    // 2. The proof would allow verification without revealing personal data
    
    // Create a download link for the QR code
    const downloadLink = document.createElement('a');
    downloadLink.href = qrCodeUrl;
    downloadLink.download = `aether-ticket-${selectedEvent.id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('Downloading ticket');
    
    // Close the modal after download
    setTimeout(() => {
      handleCloseModal();
    }, 500);
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Add animated background */}
      <AnimatedBackground />
      
      <div className="relative max-w-5xl mx-auto p-4 md:p-8 lg:p-12">
        <h1 className="text-3xl font-semibold mb-8 text-text-primary">
          Upcoming Events
        </h1>

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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
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
                      <p className="mb-2 font-medium text-text-accent">Your privacy is protected</p>
                      <p>Your personal details will be hashed securely in your browser. Only a zero-knowledge proof will be used for verification.</p>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-fast"
                    >
                      Generate Ticket
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
                  </div>
                  
                  <button
                    onClick={handleDownloadTicket}
                    className="inline-flex items-center justify-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-fast"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Ticket
                  </button>
                  
                  <p className="mt-4 text-sm text-text-secondary">
                    Your ticket includes a zero-knowledge proof that can be verified without revealing your personal information. Present the QR code at the event for verification.
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