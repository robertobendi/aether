/**
 * Utilities for zero-knowledge proof ticket generation and verification
 * 
 * Note: This is a simplified simulation for demo purposes.
 * A real implementation would use actual ZK libraries like circom, snarkjs, etc.
 */

// Simple hash function for demonstration
const simpleHash = (data) => {
  let hash = 0;
  const str = JSON.stringify(data);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and ensure it's positive
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Generate a simulated zero-knowledge proof for a ticket
 * 
 * @param {string} eventId - ID of the event
 * @param {string} email - User's email (private)
 * @param {string} name - User's name (private)
 * @param {string} ticketId - Generated ticket ID
 * @returns {Object} - Object containing the proof and demo data
 */
export const generateTicketProof = async (eventId, email, name, ticketId) => {
  // In a real implementation, this would generate actual ZK proofs
  // For this demo, we'll simulate it
  
  // Create a private input object (this would be kept secret in a real system)
  const privateInputs = {
    email,
    name,
    timestamp: Date.now(),
    ticketId
  };
  
  // Create public inputs (these would be shared)
  const publicInputs = {
    eventId,
    ticketId
  };
  
  // Generate a "hash" for verification (simulating a Merkle tree inclusion proof)
  const hashValue = simpleHash({ privateInputs, publicInputs });
  
  // Simulate time spent generating proof
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return the "proof" - in a real system this would be a complex ZK proof
  // Here we just return the hash and some metadata
  return {
    publicInputs,
    // In an actual system, we would not return private inputs!
    // This is for demo purposes only
    demoProof: {
      hashValue,
      protocol: "simulated-groth16",
      proofGenerationTime: 500,
      timestamp: Date.now()
    }
  };
};

/**
 * Store a ticket hash in local storage for verification
 * Note: In a real system, this would be stored in a smart contract or database
 * 
 * @param {string} hash - The ticket hash to store
 * @param {string} eventId - ID of the event the ticket is for
 */
export const storeTicketHash = (hash, eventId) => {
  // Get existing tickets from storage or initialize empty object
  const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
  
  // Get event tickets or initialize empty array
  const eventTickets = existingTickets[eventId] || [];
  
  // Add the new ticket hash if it doesn't exist already
  if (!eventTickets.some(ticket => ticket.hash === hash)) {
    eventTickets.push({
      hash,
      timestamp: Date.now()
    });
  }
  
  // Update the event tickets
  existingTickets[eventId] = eventTickets;
  
  // Save back to local storage
  localStorage.setItem('aetherTickets', JSON.stringify(existingTickets));
  
  return true;
};

/**
 * Verify a ticket hash
 * Note: In a real system, this would check a smart contract or database
 * 
 * @param {string} hash - The ticket hash to verify
 * @param {string} eventId - ID of the event the ticket is for
 * @returns {boolean} - Whether the ticket is valid
 */
export const verifyTicketHash = (hash, eventId) => {
  // Get existing tickets from storage
  const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
  
  // Get event tickets or return false if none exist
  const eventTickets = existingTickets[eventId] || [];
  
  // Check if the hash exists in the tickets
  return eventTickets.some(ticket => ticket.hash === hash);
};