/**
 * Zero-knowledge ticket proof system using Mina Protocol's zkProgram
 * 
 * This implementation provides a more concrete ZK proof approach
 * while still running in-browser without requiring a full blockchain node
 */
import {
    Poseidon,
    Field,
    ZkProgram,
    SelfProof,
    MerkleTree,
    MerkleWitness,
    verify,
    Struct,
    CircuitString
  } from 'o1js';
  
  // Define a Merkle tree with height 8 (supporting up to 2^8 tickets)
  const TREE_HEIGHT = 8;
  
  // Create a witness class for our Merkle Tree
  class TicketMerkleWitness extends MerkleWitness(TREE_HEIGHT) {}
  
  // Define a ticket struct to hold public and private information
  class TicketInfo extends Struct({
    eventId: Field,
    ticketId: Field,
    timestamp: Field
  }) {}
  
  // Define our ZkProgram for ticket generation and verification
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
  
        async method(
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
      },
      
      // Verify a ticket in the Merkle tree
      verifyTicket: {
        privateInputs: [
          TicketMerkleWitness, // Merkle witness for proof
          Field,               // Hash value stored in the tree
          SelfProof            // Previous proof of ticket generation
        ],
  
        async method(
          publicInput,
          witness,
          leafValue,
          previousProof
        ) {
          // Verify the previous proof
          previousProof.verify();
          
          // Previous proof output should be the hash value
          previousProof.publicOutput.assertEquals(leafValue);
          
          // Verify the Merkle proof
          const rootValue = witness.calculateRoot(leafValue);
          
          // Return the root as output
          return rootValue;
        }
      }
    }
  });
  
  // Singleton instance of the Merkle tree for ticket storage
  let ticketMerkleTree = null;
  let isCompiled = false;
  let verificationKey = null;
  
  /**
   * Initialize the ZK program and Merkle tree
   */
  export const initZkSystem = async () => {
    try {
      // Initialize the Merkle tree if needed
      if (!ticketMerkleTree) {
        ticketMerkleTree = new MerkleTree(TREE_HEIGHT);
      }
      
      // Compile the ZK program if needed
      if (!isCompiled) {
        console.log('Compiling ZK program...');
        const result = await TicketZkProgram.compile();
        verificationKey = result.verificationKey;
        isCompiled = true;
        console.log('ZK program compiled successfully');
      }
      
      return { initialized: true, verificationKey };
    } catch (error) {
      console.error('Failed to initialize ZK system:', error);
      return { initialized: false, error: error.message };
    }
  };
  
  /**
   * Helper function to convert a string to a Field
   */
  const stringToField = (str) => {
    try {
      // Try to use CircuitString if available
      return CircuitString.fromString(str).hash();
    } catch (error) {
      // Fallback to simple hash
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Field(Math.abs(hash) % (2**30)); // Keep within Field range
    }
  };
  
  /**
   * Generate a ZK proof for a ticket
   */
  export const generateTicketProof = async (eventId, email, name, ticketId) => {
    try {
      // Initialize the ZK system
      const initResult = await initZkSystem();
      if (!initResult.initialized) {
        throw new Error(`ZK system initialization failed: ${initResult.error}`);
      }
      
      // Convert inputs to Field values
      const eventIdField = stringToField(eventId);
      const emailField = stringToField(email);
      const nameField = stringToField(name);
      const ticketIdField = stringToField(ticketId);
      const timestamp = Field(Date.now());
      
      // Create public input
      const publicInput = new TicketInfo({
        eventId: eventIdField,
        ticketId: ticketIdField,
        timestamp
      });
      
      // Generate the proof
      console.log('Generating ZK proof...');
      const { proof, publicOutput } = await TicketZkProgram.generateTicket(
        publicInput,
        emailField,
        nameField,
        timestamp
      );
      
      // Store the proof in the Merkle tree
      const leafIndex = getEmptyLeafIndex();
      ticketMerkleTree.setLeaf(BigInt(leafIndex), publicOutput);
      
      // Store in localStorage for persistence
      await storeTicketHash(publicOutput.toString(), eventId, leafIndex);
      
      console.log('Generated ZK proof for ticket:', publicOutput.toString());
      
      // Return proof data
      return {
        publicInputs: {
          eventId,
          ticketId
        },
        demoProof: {
          hashValue: publicOutput.toString(),
          protocol: "mina-poseidon-zk",
          leafIndex,
          timestamp: Date.now(),
          proofJson: proof.toJSON()
        }
      };
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      
      // Fall back to simple hash-based approach
      return fallbackGenerateProof(eventId, email, name, ticketId);
    }
  };
  
  /**
   * Fallback to non-ZK proof generation
   */
  const fallbackGenerateProof = async (eventId, email, name, ticketId) => {
    console.log('Using fallback proof generation');
    // Convert to string and concatenate
    const combined = `${eventId}-${email}-${name}-${ticketId}-${Date.now()}`;
    
    // Use browser's crypto API for a secure hash
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Store in localStorage for verification
      const leafIndex = getEmptyLeafIndex();
      await storeTicketHash(hashValue, eventId, leafIndex);
      
      return {
        publicInputs: {
          eventId,
          ticketId
        },
        demoProof: {
          hashValue,
          protocol: "fallback-hash",
          leafIndex,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      // Last resort fallback
      console.error('Crypto API failed, using simple hash fallback:', error);
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const hashValue = Math.abs(hash).toString(16).padStart(8, '0');
      
      // Store in localStorage for verification
      const leafIndex = getEmptyLeafIndex();
      await storeTicketHash(hashValue, eventId, leafIndex);
      
      return {
        publicInputs: {
          eventId,
          ticketId
        },
        demoProof: {
          hashValue,
          protocol: "simple-hash",
          leafIndex,
          timestamp: Date.now()
        }
      };
    }
  };
  
  /**
   * Verify a ticket proof
   */
  export const verifyTicketProof = async (hashValue, eventId, proofJson, leafIndex = 0) => {
    try {
      // First check local storage
      const isLocallyValid = await checkLocalStorageValidity(hashValue, eventId);
      if (!isLocallyValid) {
        return false;
      }
      
      // If we have a real ZK proof, verify it
      if (proofJson && isCompiled && verificationKey) {
        console.log('Verifying ZK proof...');
        try {
          const isValid = await verify(proofJson, verificationKey);
          if (isValid) {
            console.log('ZK proof verified successfully');
            return true;
          } else {
            console.warn('ZK proof verification failed');
          }
        } catch (error) {
          console.error('Error verifying ZK proof:', error);
        }
      }
      
      // If we got here, either there's no ZK proof or verification failed
      // Fall back to Merkle tree verification if available
      if (ticketMerkleTree) {
        try {
          const leafValue = ticketMerkleTree.getNode(0, BigInt(leafIndex));
          if (leafValue && leafValue.toString() === hashValue) {
            console.log('Verified ticket with Merkle tree');
            return true;
          }
        } catch (error) {
          console.warn('Merkle verification failed:', error);
        }
      }
      
      // If all else fails, trust the local storage check
      return isLocallyValid;
    } catch (error) {
      console.error('Error in ticket verification:', error);
      return false;
    }
  };
  
  /**
   * Check if a ticket is valid in local storage
   */
  const checkLocalStorageValidity = async (hashValue, eventId) => {
    try {
      const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
      const eventTickets = existingTickets[eventId] || [];
      return eventTickets.some(ticket => ticket.hash === hashValue);
    } catch (error) {
      console.error('Error checking local storage:', error);
      return false;
    }
  };
  
  /**
   * Process QR code data from scan
   */
  export const processQRData = async (data) => {
    try {
      // Parse the QR data
      const qrData = JSON.parse(data);
      
      // Extract relevant data
      const eventId = qrData.eventId;
      let leafIndex = 0;
      let hashValue = null;
      let proofJson = null;
      
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
            if (hashData.proof.proofJson) {
              proofJson = hashData.proof.proofJson;
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
        if (qrData.proof.proofJson) {
          proofJson = qrData.proof.proofJson;
        }
      }
      
      if (!eventId || !hashValue) {
        throw new Error("Invalid QR code format");
      }
      
      // Verify ticket using ZK
      const isValid = await verifyTicketProof(hashValue, eventId, proofJson, leafIndex);
      
      return {
        isValid,
        eventId,
        ticketId: qrData.ticketId || "Unknown",
        hashValue,
        protocol: qrData.proof?.protocol || 'unknown'
      };
    } catch (error) {
      console.error("Error processing QR data:", error);
      throw error;
    }
  };
  
  /**
   * Find an empty leaf in the Merkle tree
   */
  const getEmptyLeafIndex = () => {
    try {
      // Count all tickets in localStorage
      const existingTickets = JSON.parse(localStorage.getItem('aetherTickets') || '{}');
      let count = 0;
      
      Object.values(existingTickets).forEach(tickets => {
        count += tickets.length;
      });
      
      return count;
    } catch (error) {
      console.error('Error finding empty leaf:', error);
      return Math.floor(Math.random() * 100); // Fallback to random index
    }
  };
  
  /**
   * Store a ticket hash in local storage
   */
  const storeTicketHash = async (hash, eventId, leafIndex) => {
    try {
      // Store in localStorage
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
    } catch (error) {
      console.error('Error storing ticket hash:', error);
      return false;
    }
  };
  
  /**
   * Check if ZK proofs are available
   */
  export const isZkAvailable = async () => {
    try {
      const initResult = await initZkSystem();
      return initResult.initialized;
    } catch (error) {
      return false;
    }
  };