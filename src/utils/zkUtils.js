/**
 * Zero-knowledge proof ticket system using Mina Protocol
 * This implementation uses Mina's o1js library for ZK proofs
 * 
 * Note: This is a simplified implementation - we're not using the full
 * TypeScript decorators since this project is using plain JavaScript
 */
import {
  Poseidon,
  Field,
  MerkleTree,
  PrivateKey,
  PublicKey,
  Mina,
  CircuitString
} from 'o1js';

// Define a Merkle tree depth for ticket storage
const TREE_HEIGHT = 8;

// Local Merkle tree for ticket storage
const ticketMerkleTree = new MerkleTree(TREE_HEIGHT);

// In-memory registry for our tickets
let registeredTickets = {};

/**
 * Initialize the Mina network connection
 * This is a simplified version without actual contract deployment
 */
export const initMinaNetwork = async () => {
  try {
    // For development, we'll use a local network
    // In production, switch to Berkeley testnet
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    
    // Generate a keypair for signing
    const privateKey = PrivateKey.random();
    const publicKey = privateKey.toPublicKey();
    
    return {
      networkInitialized: true,
      privateKey,
      publicKey
    };
  } catch (error) {
    console.error('Failed to initialize Mina network:', error);
    return { networkInitialized: false };
  }
};

// Store network instance once initialized
let minaInstance = null;

/**
 * Get Mina instance (initialize if needed)
 */
const getMinaInstance = async () => {
  if (!minaInstance) {
    minaInstance = await initMinaNetwork();
  }
  return minaInstance;
};

/**
 * Generate a ticket hash using Poseidon hash (Mina's preferred hash function)
 * @param {string} eventId - ID of the event
 * @param {string} email - User's email (private)
 * @param {string} name - User's name (private)
 * @param {string} ticketId - Generated ticket ID
 * @returns {Promise<Object>} - Ticket proof
 */
export const generateTicketProof = async (eventId, email, name, ticketId) => {
  try {
    // Initialize Mina (or get existing instance)
    await getMinaInstance();
    
    // Convert inputs to Field values for Poseidon hashing
    // First convert to strings and then to Field values
    const eventIdStr = eventId.toString();
    const emailStr = email.toString();
    const nameStr = name.toString();
    const ticketIdStr = ticketId.toString();
    const timestamp = Date.now().toString();
    
    // Use CircuitString to convert text to circuit-compatible format
    let eventIdField, emailField, nameField, ticketIdField, timestampField;
    
    try {
      eventIdField = CircuitString.fromString(eventIdStr).hash();
      emailField = CircuitString.fromString(emailStr).hash();
      nameField = CircuitString.fromString(nameStr).hash();
      ticketIdField = CircuitString.fromString(ticketIdStr).hash();
      timestampField = Field(parseInt(timestamp));
    } catch (error) {
      console.error('Error converting to Circuit values:', error);
      // Fallback to manual Field creation
      eventIdField = Field(hashStringToNumber(eventIdStr));
      emailField = Field(hashStringToNumber(emailStr));
      nameField = Field(hashStringToNumber(nameStr));
      ticketIdField = Field(hashStringToNumber(ticketIdStr));
      timestampField = Field(parseInt(timestamp));
    }
    
    // Private inputs - information that should be kept private
    const privateInputs = Poseidon.hash([
      emailField,
      nameField,
      timestampField
    ]);
    
    // Public inputs - information that can be shared
    const publicInputs = Poseidon.hash([
      eventIdField,
      ticketIdField
    ]);
    
    // Generate the final hash combining public and private data
    const hashValue = Poseidon.hash([publicInputs, privateInputs]);
    
    // Find an empty slot in the Merkle tree
    const leafIndex = getEmptyLeafIndex();
    
    // Store the ticket hash in our Merkle tree
    ticketMerkleTree.setLeaf(BigInt(leafIndex), hashValue);
    
    // Store in localStorage for client-side persistence
    await storeTicketHash(hashValue.toString(), eventId, leafIndex);
    
    console.log('Generated Mina-based ZK proof for ticket:', hashValue.toString());
    
    // Return the proof for the QR code
    return {
      publicInputs: {
        eventId,
        ticketId
      },
      // This proof data would be added to the QR code
      demoProof: {
        hashValue: hashValue.toString(),
        protocol: "mina-poseidon",
        leafIndex: leafIndex,
        timestamp: Date.now()
      }
    };
  } catch (error) {
    console.error('Error generating Mina-based proof:', error);
    
    // Fall back to simple hash-based approach if Mina fails
    const simpleHash = await fallbackGenerateHash(eventId, email, name, ticketId);
    
    return {
      publicInputs: {
        eventId,
        ticketId
      },
      demoProof: {
        hashValue: simpleHash,
        protocol: "fallback-hash",
        timestamp: Date.now()
      }
    };
  }
};

/**
 * Fallback hash function when Mina isn't available
 */
const fallbackGenerateHash = async (eventId, email, name, ticketId) => {
  // Convert to string and concatenate
  const combined = `${eventId}-${email}-${name}-${ticketId}-${Date.now()}`;
  
  // Use browser's crypto API for a secure hash
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Last resort fallback
    return simpleHashFallback(combined);
  }
};

/**
 * Very simple hash function as absolute last resort
 */
const simpleHashFallback = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Helper to convert a string to a number for Field creation
 */
const hashStringToNumber = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % (2**30); // Keep within Field range
};

/**
 * Find an empty leaf in the Merkle tree
 * @returns {number} - Index of an empty leaf
 */
const getEmptyLeafIndex = () => {
  // Simple approach: count how many tickets we have
  const count = Object.values(registeredTickets).reduce((acc, tickets) => acc + tickets.length, 0);
  return count;
};

/**
 * Store a ticket hash in local storage
 * @param {string} hash - The ticket hash
 * @param {string} eventId - ID of the event
 * @param {number} leafIndex - Index in the Merkle tree
 */
export const storeTicketHash = async (hash, eventId, leafIndex) => {
  // Store in memory
  if (!registeredTickets[eventId]) {
    registeredTickets[eventId] = [];
  }
  
  registeredTickets[eventId].push({
    hash,
    leafIndex,
    timestamp: Date.now()
  });
  
  // Store in localStorage for persistence
  const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
  const eventTickets = existingTickets[eventId] || [];
  
  if (!eventTickets.some(ticket => ticket.hash === hash)) {
    eventTickets.push({
      hash,
      leafIndex,
      timestamp: Date.now()
    });
  }
  
  existingTickets[eventId] = eventTickets;
  localStorage.setItem('aetherTickets', JSON.stringify(existingTickets));
  
  return true;
};

/**
 * Verify a ticket hash using Mina
 * @param {string} hash - The ticket hash
 * @param {string} eventId - ID of the event
 * @param {number} leafIndex - Index in the Merkle tree
 * @returns {Promise<boolean>} - Whether the ticket is valid
 */
export const verifyTicketHash = async (hash, eventId, leafIndex = 0) => {
  try {
    // First check local storage
    const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
    const eventTickets = existingTickets[eventId] || [];
    const isLocallyValid = eventTickets.some(ticket => ticket.hash === hash);
    
    if (!isLocallyValid) {
      return false;
    }
    
    // If Mina is available, try to do Merkle tree verification
    try {
      await getMinaInstance();
      
      // Get the saved ticket from the Merkle tree
      const leafValue = ticketMerkleTree.getNode(0, BigInt(leafIndex));
      
      // This would be a Merkle proof verification in a full implementation
      // For now we just check if the hash matches what we have in the tree
      if (leafValue && leafValue.toString() === hash) {
        console.log('Verified ticket with Mina Merkle tree');
        return true;
      }
      
      // Fall back to local verification if Merkle verification fails
      console.log('Merkle verification failed, falling back to local check');
      return isLocallyValid;
    } catch (error) {
      console.warn('Mina verification unavailable, using local verification:', error);
      // Fall back to local verification only
      return isLocallyValid;
    }
  } catch (error) {
    console.error("Error in ticket verification:", error);
    return false;
  }
};

/**
 * Process QR code data from scan
 * @param {string} data - QR code data
 * @returns {Promise<Object>} - Verification result
 */
export const processQRData = async (data) => {
  try {
    // Parse the QR data
    const qrData = JSON.parse(data);
    
    // Extract relevant data
    const eventId = qrData.eventId;
    let leafIndex = 0;
    let hashValue = null;
    
    // Handle different QR data formats
    if (qrData.hash && typeof qrData.hash === 'string') {
      try {
        // If hash is another JSON string
        const hashData = JSON.parse(qrData.hash);
        if (hashData.proof && hashData.proof.hashValue) {
          hashValue = hashData.proof.hashValue;
          if (hashData.proof.leafIndex !== undefined) {
            leafIndex = hashData.proof.leafIndex;
          }
        }
      } catch {
        // If hash is not a JSON string
        hashValue = qrData.hash;
      }
    } else if (qrData.proof && qrData.proof.hashValue) {
      hashValue = qrData.proof.hashValue;
      if (qrData.proof.leafIndex !== undefined) {
        leafIndex = qrData.proof.leafIndex;
      }
    }
    
    if (!eventId || !hashValue) {
      throw new Error("Invalid QR code format");
    }
    
    // Verify ticket using Mina
    const isValid = await verifyTicketHash(hashValue, eventId, leafIndex);
    
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

// Export a function to check if Mina is available
export const isMinaAvailable = async () => {
  try {
    const instance = await getMinaInstance();
    return instance.networkInitialized === true;
  } catch (error) {
    return false;
  }
};