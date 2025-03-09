import { Globe, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

function Home() {
  const features = [
    { title: "Private", description: "Zero personal data exposure.", icon: <ShieldCheck className="w-6 h-6 text-accent" /> },
    { title: "Decentralized", description: "Fully on-chain with no central authority.", icon: <Globe className="w-6 h-6 text-accent" /> },
    { title: "Instant", description: "Sub-second verification time.", icon: <Zap className="w-6 h-6 text-accent" /> }
  ];

  return (
    <div className="relative min-h-screen bg-background font-sans overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute w-[600px] h-[600px] bg-accent opacity-30 blur-3xl rounded-full top-[-100px] left-[-200px]"
          animate={{ scale: [1, 1.2, 1], borderRadius: ["50%", "45%", "50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute w-[500px] h-[500px] bg-primary opacity-30 blur-3xl rounded-full bottom-[-150px] right-[-150px]"
          animate={{ scale: [1, 1.2, 1], borderRadius: ["50%", "40%", "50%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-text-primary mb-6">
            <span className="text-accent">ZK</span> Ticket
          </h1>
          <p className="text-text-secondary text-lg mb-8">
            A decentralized ticketing platform powered by zero-knowledge proofs. 
            Experience seamless verification with complete privacy.
          </p>
          <div className="flex justify-center">
            <button 
              className="px-6 py-3 border border-border-primary text-text-primary rounded-xl hover:bg-surface transition"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative px-6 pb-12">
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-surface p-6 rounded-xl border border-border-primary shadow-lg flex flex-col items-center text-center">
              <div className="mb-3">{feature.icon}</div>
              <h3 className="text-text-primary text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
