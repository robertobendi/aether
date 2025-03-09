/**
 * Enhanced ticket verification using real cryptography
 * A simplified approach that uses proper crypto without the full ZK setup
 */

/**
 * Generate a SHA-256 hash of the given data
 * @param {any} data - Data to hash
 * @returns {Promise<string>} - Hex string hash
 */
const sha256Hash = async (data) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a cryptographic proof for a ticket
 * @param {string} eventId - ID of the event
 * @param {string} email - User's email (private)
 * @param {string} name - User's name (private)
 * @param {string} ticketId - Generated ticket ID
 * @returns {Promise<Object>} - Ticket proof
 */
export const generateTicketProof = async (eventId, email, name, ticketId) => {
  // Private inputs that should never leave the client
  const privateInputs = {
    email,
    name,
    timestamp: Date.now()
  };
  
  // Public inputs that can be shared
  const publicInputs = {
    eventId,
    ticketId
  };
  
  // Generate commitment to private data
  const privateCommitment = await sha256Hash(privateInputs);
  
  // Generate the final hash combining public and private data
  const hashValue = await sha256Hash({
    publicInputs,
    privateCommitment
  });
  
  // Return the proof (with real cryptographic hash)
  return {
    publicInputs,
    hashValue,
    // This proof data would be added to the QR code
    proof: {
      hashValue,
      protocol: "sha256-commitment",
      timestamp: Date.now()
    }
  };
};

/**
 * Store a ticket hash in local storage
 * @param {string} hash - The ticket hash
 * @param {string} eventId - ID of the event
 */
export const storeTicketHash = (hash, eventId) => {
  const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
  const eventTickets = existingTickets[eventId] || [];
  
  if (!eventTickets.some(ticket => ticket.hash === hash)) {
    eventTickets.push({
      hash,
      timestamp: Date.now()
    });
  }
  
  existingTickets[eventId] = eventTickets;
  localStorage.setItem('aetherTickets', JSON.stringify(existingTickets));
  
  return true;
};

/**
 * Verify a ticket hash
 * @param {string} hash - The ticket hash
 * @param {string} eventId - ID of the event
 * @returns {boolean} - Whether the ticket is valid
 */
export const verifyTicketHash = (hash, eventId) => {
  const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
  const eventTickets = existingTickets[eventId] || [];
  return eventTickets.some(ticket => ticket.hash === hash);
};

/**
 * Process QR code data
 * @param {string} data - QR code data
 * @returns {Object} - Processed ticket data
 */
export const processQRData = (data) => {
  try {
    // Parse the QR data
    const qrData = JSON.parse(data);
    
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
    const isValid = verifyTicketHash(hashValue, eventId);
    
    return {
      isValid,
      eventId,
      ticketId: qrData.ticketId || "Unknown",
      hashValue
    };
  } catch (error) {
    console.error("Error processing QR data:", error);
    throw error;
  }
};