// Simplified version without Node.js dependencies for hackathon demo
// In a real implementation, you would use actual ZK libraries

// Simple hash function for demo purposes
const simpleHash = async (data) => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  
  // Use Web Crypto API for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Generate a ZK proof for ticket ownership (simplified for demo)
export const generateTicketProof = async (eventId, email, name, ticketId) => {
  try {
    // Hash the user data
    const userDataString = `${email}:${name}:${ticketId}`;
    const userDataHash = await simpleHash(userDataString);
    
    // Hash the event data
    const eventHash = await simpleHash(eventId);
    
    // Create a commitment that doesn't reveal the user data
    const commitment = await simpleHash(`${eventHash}:${userDataHash}`);
    
    // For a hackathon demo, simulate a ZK proof
    // In a real ZK implementation, this would be an actual ZK proof
    return {
      // The proof contains NO personal information
      demoProof: {
        eventId: eventId,
        hashValue: commitment,
        timestamp: Date.now()
      }
    };
  } catch (error) {
    console.error("Error generating proof:", error);
    
    // Fallback for demo
    return {
      simulated: true,
      demoProof: {
        eventId,
        hashValue: `zk-${Math.random().toString(36).substring(2, 15)}`,
        timestamp: Date.now()
      }
    };
  }
};

// Verify a ticket proof
export const verifyTicketProof = async (proof, publicSignals) => {
  // In a real app, this would verify the ZK proof
  // For hackathon demo, we'll simulate verification
  
  try {
    // Simple simulation of verification
    return true;
  } catch (error) {
    console.error("Error verifying proof:", error);
    return false;
  }
};

// Store ticket hash in local storage
export const storeTicketHash = (ticketHash, eventId) => {
  try {
    // Get existing tickets from local storage
    const storedTickets = localStorage.getItem('zkTickets') || '{}';
    const tickets = JSON.parse(storedTickets);
    
    // Add new ticket
    if (!tickets[eventId]) {
      tickets[eventId] = [];
    }
    
    tickets[eventId].push({
      hash: ticketHash,
      timestamp: Date.now()
    });
    
    // Save back to local storage
    localStorage.setItem('zkTickets', JSON.stringify(tickets));
    
    return true;
  } catch (error) {
    console.error("Error storing ticket hash:", error);
    return false;
  }
};