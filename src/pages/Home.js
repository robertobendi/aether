import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ShieldCheck, Zap, Ticket } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import EmojiTicket from "../components/EmojiTicket";

function Home() {
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    { title: "Private", description: "Zero personal data exposure.", icon: <ShieldCheck className="w-6 h-6 text-accent" /> },
    { title: "Decentralized", description: "Fully on-chain with no central authority.", icon: <Globe className="w-6 h-6 text-accent" /> },
    { title: "Instant", description: "Sub-second verification time.", icon: <Zap className="w-6 h-6 text-accent" /> }
  ];

  return (
    <div className="relative min-h-screen bg-background font-sans overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Hero Section with Larger Ticket */}
      <div className="relative min-h-[85vh] flex items-center px-4 md:px-6">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Left Column: Text and Call to Actions */}
            <div className="md:w-1/2 text-left mb-8 md:mb-0">
              {/* Animated Gradient Title */}
              <h1 className="text-7xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-accent to-blue-600 animate-gradient-x">
                Aether
              </h1>
              <p className="text-text-secondary text-lg mb-6">
                A decentralized ticketing platform powered by zero-knowledge proofs. 
                Experience seamless verification with complete privacy.
              </p>
              
              <div className="flex gap-4 mt-6">
                <Link to="/events">
                  <button 
                    className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-opacity-90 transition"
                  >
                    Browse Events
                  </button>
                </Link>
                <button 
                  onClick={() => setShowDemo(!showDemo)}
                  className="px-6 py-3 border border-border-primary text-text-primary rounded-xl hover:bg-surface transition"
                >
                  How It Works
                </button>
              </div>
            </div>
            
            {/* Right Column: Larger Ticket */}
            <div className="md:w-1/2 flex justify-center md:justify-end transform scale-125 md:scale-150">
              <EmojiTicket />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Compact */}
      <div className="relative px-4 md:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-surface p-6 rounded-xl border border-border-primary shadow-lg flex items-center"
              >
                <div className="mr-4 p-3 bg-background bg-opacity-30 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-text-primary text-lg font-semibold">{feature.title}</h3>
                  <p className="text-text-secondary text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works Section - Conditional and Compact */}
      {showDemo && (
        <div className="relative px-4 md:px-6 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="bg-surface p-6 rounded-xl border border-border-primary shadow-lg">
              <h3 className="text-xl font-medium text-text-primary mb-4">
                Zero-Knowledge Privacy
              </h3>
              <p className="text-text-secondary mb-4">
                Aether Ticket generates cryptographic proofs that verify ticket ownership 
                without revealing any personal data. Your information never leaves your device.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start">
                  <span className="text-accent mr-2 text-lg">•</span>
                  <span className="text-text-secondary text-sm">Your ticket details are hashed and stored locally</span>
                </div>
                <div className="flex items-start">
                  <span className="text-accent mr-2 text-lg">•</span>
                  <span className="text-text-secondary text-sm">Zero-knowledge proofs are generated in your browser</span>
                </div>
                <div className="flex items-start">
                  <span className="text-accent mr-2 text-lg">•</span>
                  <span className="text-text-secondary text-sm">Verification happens on-device with no data sharing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;