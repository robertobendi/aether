import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ShieldCheck, Zap, Ticket } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";

function Home() {
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    { title: "Private", description: "Zero personal data exposure.", icon: <ShieldCheck className="w-6 h-6 text-accent" /> },
    { title: "Decentralized", description: "Fully on-chain with no central authority.", icon: <Globe className="w-6 h-6 text-accent" /> },
    { title: "Instant", description: "Sub-second verification time.", icon: <Zap className="w-6 h-6 text-accent" /> }
  ];

  const demoSteps = [
    { title: "Browse Events", description: "Find free events in your area", icon: <Ticket className="w-5 h-5" /> },
    { title: "Get Ticket", description: "Claim your Aether ticket without exposing personal data", icon: <ShieldCheck className="w-5 h-5" /> },
    { title: "Verify Entry", description: "Present your QR code for instant verification", icon: <Zap className="w-5 h-5" /> }
  ];

  return (
    <div className="relative min-h-screen bg-background font-sans overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="relative py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-text-primary mb-6">
            <span className="text-accent">Aether</span>
          </h1>
          <p className="text-text-secondary text-lg mb-8">
            A decentralized ticketing platform powered by zero-knowledge proofs. 
            Experience seamless verification with complete privacy.
          </p>
          <div className="flex justify-center gap-4">
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
      </div>

      {/* How it Works Section */}
      {showDemo && (
        <div className="relative px-6 py-8 mb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">
              How Aether Ticket Works
            </h2>
            
            <div className="relative flex flex-col md:flex-row gap-6 mb-8">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-0.5 bg-border-primary z-0"></div>
              
              {/* Steps */}
              {demoSteps.map((step, index) => (
                <div key={index} className="flex-1 relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center border-2 border-accent mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-text-primary font-medium mb-1">{step.title}</h3>
                    <p className="text-text-secondary text-sm text-center">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-border-primary">
              <h3 className="text-lg font-medium text-text-primary mb-4">
                Zero-Knowledge Privacy
              </h3>
              <p className="text-text-secondary mb-4">
                Aether Ticket generates cryptographic proofs that verify ticket ownership 
                without revealing any personal data. Your information never leaves your device.
              </p>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span>Your ticket details are hashed and stored locally</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span>Zero-knowledge proofs are generated entirely in your browser</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span>Verification happens on-device with no data sharing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

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