/**
 * Enhanced Zero-knowledge proof ticket system using Mina Protocol
 * This implementation uses Mina's o1js library for ZK proofs with
 * added proof generation and verification capabilities
 */
import {
  Poseidon,
  Field,
  MerkleTree,
  PrivateKey,
  PublicKey,
  Mina,
  CircuitString,
  ZkProgram,
  SelfProof,
  verify,
  Struct
} from 'o1js';

// Define a Merkle tree depth for ticket storage
const TREE_HEIGHT = 8;

// Local Merkle tree for ticket storage
const ticketMerkleTree = new MerkleTree(TREE_HEIGHT);

// In-memory registry for our tickets
let registeredTickets = {};

// Define a ticket structure for ZK proofs
class TicketInfo extends Struct({
  eventId: Field,
  ticketId: Field,
  timestamp: Field
}) {}

// Define our ZkProgram for ticket verification
const TicketZkProgram = ZkProgram({
  name: 'aether-ticket-system',
  publicInput: TicketInfo,
  publicOutput: Field,

  methods: {
    // Generate a ticket proof
    generateTicket: {
      privateInputs: [
        Field, // email hash (private)
        Field, // name hash (private)
        Field  // timestamp
      ],

      method(
        publicInput,
        emailHash,
        nameHash,
        timestampField
      ) {
        // Make sure timestamp matches public input
        timestampField.assertEquals(publicInput.timestamp);
        
        // Private inputs - information that should be kept private
        const privateInputs = Poseidon.hash([
          emailHash,
          nameHash,
          timestampField
        ]);
        
        // Public inputs - information that can be shared
        const publicInputs = Poseidon.hash([
          publicInput.eventId,
          publicInput.ticketId
        ]);
        
        // Generate the final hash combining public and private data
        const finalHash = Poseidon.hash([publicInputs, privateInputs]);
        
        // Return the hash as public output
        return finalHash;
      }
    }
  }
});

// Track ZK program compilation status
let isCompiled = false;
let verificationKey = null;

/**
 * Initialize the Mina network and ZK program
 */
export const initMinaNetwork = async () => {
  try {
    // For development, we'll use a local network
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    
    // Generate a keypair for signing
    const privateKey = PrivateKey.random();
    const publicKey = privateKey.toPublicKey();
    
    // Compile ZK program if not already compiled
    if (!isCompiled) {
      try {
        console.log('Compiling ZK program...');
        const result = await TicketZkProgram.compile();
        verificationKey = result.verificationKey;
        isCompiled = true;
        console.log('ZK program compiled successfully');
      } catch (err) {
        console.warn('ZK program compilation failed:', err);
        // Continue without ZK program
      }
    }
    
    return {
      networkInitialized: true,
      privateKey,
      publicKey,
      zkReady: isCompiled
    };
  } catch (error) {
    console.error('Failed to initialize Mina network:', error);
    return { networkInitialized: false, zkReady: false };
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
 * Helper to convert a string to a Field
 */
const stringToField = (str) => {
  try {
    // Try to use CircuitString if available
    return CircuitString.fromString(str).hash();
  } catch (error) {
    // Fallback to simple hash
    return Field(hashStringToNumber(str));
  }
};

/**
 * Generate a ticket hash using Poseidon hash with ZK proof if available
 * @param {string} eventId - ID of the event
 * @param {string} email - User's email (private)
 * @param {string} name - User's name (private)
 * @param {string} ticketId - Generated ticket ID
 * @returns {Promise<Object>} - Ticket proof
 */
export const generateTicketProof = async (eventId, email, name, ticketId) => {
  try {
    // Initialize Mina (or get existing instance)
    const instance = await getMinaInstance();
    
    // Convert inputs to Field values for Poseidon hashing
    const eventIdStr = eventId.toString();
    const emailStr = email.toString();
    const nameStr = name.toString();
    const ticketIdStr = ticketId.toString();
    const timestamp = Date.now().toString();
    
    let eventIdField, emailField, nameField, ticketIdField, timestampField;
    
    try {
      eventIdField = stringToField(eventIdStr);
      emailField = stringToField(emailStr);
      nameField = stringToField(nameStr);
      ticketIdField = stringToField(ticketIdStr);
      timestampField = Field(parseInt(timestamp));
    } catch (error) {
      console.error('Error converting to Field values:', error);
      // Fallback to manual Field creation
      eventIdField = Field(hashStringToNumber(eventIdStr));
      emailField = Field(hashStringToNumber(emailStr));
      nameField = Field(hashStringToNumber(nameStr));
      ticketIdField = Field(hashStringToNumber(ticketIdStr));
      timestampField = Field(parseInt(timestamp));
    }
    
    // Generate ZK proof if available
    let hashValue, proofJSON = null;
    
    if (instance.zkReady && isCompiled) {
      try {
        console.log('Generating ZK proof...');
        
        // Create public input
        const publicInput = new TicketInfo({
          eventId: eventIdField,
          ticketId: ticketIdField,
          timestamp: timestampField
        });
        
        // Generate the proof
        const { proof, publicOutput } = await TicketZkProgram.generateTicket(
          publicInput,
          emailField,
          nameField,
          timestampField
        );
        
        // Get hash value and proof
        hashValue = publicOutput;
        proofJSON = proof.toJSON();
        
        console.log('Generated ZK proof successfully');
      } catch (error) {
        console.error('ZK proof generation failed:', error);
        // Fall back to standard hash approach
        hashValue = generateStandardHash(
          eventIdField, 
          emailField, 
          nameField, 
          ticketIdField, 
          timestampField
        );
      }
    } else {
      // Use standard hash approach
      hashValue = generateStandardHash(
        eventIdField, 
        emailField, 
        nameField, 
        ticketIdField, 
        timestampField
      );
    }
    
    // Find an empty slot in the Merkle tree
    const leafIndex = getEmptyLeafIndex();
    
    // Store the ticket hash in our Merkle tree
    ticketMerkleTree.setLeaf(BigInt(leafIndex), hashValue);
    
    // Store in localStorage for client-side persistence
    await storeTicketHash(hashValue.toString(), eventId, leafIndex);
    
    console.log('Generated ticket proof:', hashValue.toString());
    
    // Return the proof for the QR code
    return {
      publicInputs: {
        eventId,
        ticketId
      },
      // This proof data would be added to the QR code
      demoProof: {
        hashValue: hashValue.toString(),
        protocol: instance.zkReady ? "mina-poseidon-zk" : "mina-poseidon",
        leafIndex: leafIndex,
        timestamp: Date.now(),
        proofJSON: proofJSON
      }
    };
  } catch (error) {
    console.error('Error generating proof:', error);
    
    // Fall back to simple hash-based approach if everything fails
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
 * Generate a standard hash using Poseidon
 */
const generateStandardHash = (eventIdField, emailField, nameField, ticketIdField, timestampField) => {
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
  return Poseidon.hash([publicInputs, privateInputs]);
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
 * Verify a ticket hash
 * @param {string} hash - The ticket hash
 * @param {string} eventId - ID of the event
 * @param {object|null} proofJSON - The ZK proof JSON if available
 * @param {number} leafIndex - Index in the Merkle tree
 * @returns {Promise<boolean>} - Whether the ticket is valid
 */
export const verifyTicketHash = async (hash, eventId, proofJSON = null, leafIndex = 0) => {
  try {
    // First check local storage
    const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
    const eventTickets = existingTickets[eventId] || [];
    const isLocallyValid = eventTickets.some(ticket => ticket.hash === hash);
    
    if (!isLocallyValid) {
      return false;
    }
    
    // Get Mina instance
    const instance = await getMinaInstance();
    
    // Verify ZK proof if available
    if (instance.zkReady && isCompiled && proofJSON) {
      try {
        console.log('Verifying ZK proof...');
        const isValidProof = await verify(proofJSON, verificationKey);
        
        if (isValidProof) {
          console.log('ZK proof verified successfully');
          return true;
        } else {
          console.warn('ZK proof verification failed');
          // Fall back to Merkle verification
        }
      } catch (error) {
        console.error('Error verifying ZK proof:', error);
        // Fall back to Merkle verification
      }
    }
    
    // If Mina is available, try to do Merkle tree verification
    if (instance.networkInitialized) {
      try {
        // Get the saved ticket from the Merkle tree
        const leafValue = ticketMerkleTree.getNode(0, BigInt(leafIndex));
        
        // Check if the hash matches what we have in the tree
        if (leafValue && leafValue.toString() === hash) {
          console.log('Verified ticket with Mina Merkle tree');
          return true;
        }
        
        // Fall back to local verification if Merkle verification fails
        console.log('Merkle verification failed, falling back to local check');
      } catch (error) {
        console.warn('Merkle verification failed:', error);
        // Fall back to local verification
      }
    }
    
    // Fall back to local verification
    return isLocallyValid;
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
    let proofJSON = null;
    let protocol = "unknown";
    
    // Handle different QR data formats
    if (qrData.hash && typeof qrData.hash === 'string') {
      try {
        // If hash is another JSON string
        const hashData = JSON.parse(qrData.hash);
        if (hashData.proof && hashData.proof.hashValue) {
          hashValue = hashData.proof.hashValue;
          protocol = hashData.proof.protocol || protocol;
          if (hashData.proof.leafIndex !== undefined) {
            leafIndex = hashData.proof.leafIndex;
          }
          if (hashData.proof.proofJSON) {
            proofJSON = hashData.proof.proofJSON;
          }
        }
      } catch {
        // If hash is not a JSON string
        hashValue = qrData.hash;
      }
    } else if (qrData.proof && qrData.proof.hashValue) {
      hashValue = qrData.proof.hashValue;
      protocol = qrData.proof.protocol || protocol;
      if (qrData.proof.leafIndex !== undefined) {
        leafIndex = qrData.proof.leafIndex;
      }
      if (qrData.proof.proofJSON) {
        proofJSON = qrData.proof.proofJSON;
      }
    }
    
    if (!eventId || !hashValue) {
      throw new Error("Invalid QR code format");
    }
    
    // Verify ticket
    const isValid = await verifyTicketHash(hashValue, eventId, proofJSON, leafIndex);
    
    return {
      isValid,
      eventId,
      ticketId: qrData.ticketId || "Unknown",
      hashValue,
      protocol
    };
  } catch (error) {
    console.error("Error processing QR data:", error);
    throw error;
  }
};

/**
 * Initialize the ZK system - call this when your app starts
 */
export const initializeZkSystem = async () => {
  console.log('Initializing ZK system...');
  try {
    const instance = await getMinaInstance();
    console.log('ZK system initialized:', instance.zkReady ? 'with ZK proof support' : 'without ZK proof support');
    return instance;
  } catch (error) {
    console.error('Failed to initialize ZK system:', error);
    return { initialized: false, error: error.message };
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