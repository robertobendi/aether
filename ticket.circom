pragma circom 2.0.0;

include "node_modules/circomlib/circuits/mimcsponge.circom";

template TicketVerifier() {
    // Public inputs
    signal input eventId;
    signal input ticketId;
    
    // Private inputs
    signal input email;
    signal input name;
    signal input timestamp;
    
    // Output hash
    signal output hashOut;
    
    // Use MiMC hash function
    component hasher = MiMCSponge(5, 220, 1);
    
    hasher.ins[0] <== eventId;
    hasher.ins[1] <== ticketId;
    hasher.ins[2] <== email;
    hasher.ins[3] <== name;
    hasher.ins[4] <== timestamp;
    
    hasher.k <== 0;
    
    hashOut <== hasher.outs[0];
}

component main {public [eventId, ticketId]} = TicketVerifier();