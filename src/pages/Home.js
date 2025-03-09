import { useState, useEffect } from 'react';

const Home = () => {
  const [hovered, setHovered] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animate content on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: 'Zero-Knowledge Proofs',
      description: 'Prove ticket ownership without revealing your personal data. Your privacy is guaranteed with advanced cryptography.',
      icon: (
        <svg className="w-8 h-8 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Decentralized Ticketing',
      description: 'Fully on-chain ticket system prevents fraud and enables secure peer-to-peer transfers without intermediaries.',
      icon: (
        <svg className="w-8 h-8 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: 'Instant Verification',
      description: 'Fast validation process ensures seamless entry at events with just a tap. No more waiting in long lines.',
      icon: (
        <svg className="w-8 h-8 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      title: 'Anti-Scalping Protection',
      description: 'Smart contracts prevent ticket scalping while enabling legitimate transfers between users at fair prices.',
      icon: (
        <svg className="w-8 h-8 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const glowStyle = {
    filter: 'drop-shadow(0 0 10px rgba(77, 142, 255, 0.5))',
    WebkitFilter: 'drop-shadow(0 0 10px rgba(77, 142, 255, 0.5))'
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <div className={`min-h-[75vh] flex items-center justify-center py-20 px-4 bg-gradient-radial from-surface to-background transition-all duration-DEFAULT ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block p-4 rounded-full bg-surface shadow-accent mb-8">
            <svg className="w-24 h-24 text-text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">ZK Ticket</h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            A decentralized ticketing platform using zero-knowledge proofs. 
            Verify ticket ownership without revealing personal information.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="#learn"
              className="inline-block px-12 py-4 border-2 border-text-accent text-text-accent rounded-full shadow-accent transition-all duration-DEFAULT transform hover:scale-105 hover:shadow-2xl"
            >
              Learn More
            </a>
            <a 
              href="#demo"
              className="inline-block px-12 py-4 bg-text-accent text-white rounded-full shadow-accent transition-all duration-DEFAULT transform hover:scale-105 hover:shadow-2xl"
            >
              Try Demo
            </a>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="learn" className="max-w-6xl mx-auto p-8 md:p-16">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-surface rounded-lg p-8 shadow-lg transition-all duration-DEFAULT border border-opacity-20 border-border-primary transform hover:-translate-y-2 hover:shadow-2xl"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="bg-background p-4 rounded mb-6 w-fit shadow-md">
                {feature.icon}
              </div>
              <h3 className="text-text-primary text-2xl font-semibold mb-4">
                {feature.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-surface py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-16">The ZK Ticket Process</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-background p-8 rounded-lg text-center relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-text-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-accent">1</div>
              <svg className="w-12 h-12 mx-auto mb-4 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 className="text-text-primary text-lg font-medium mb-2">Purchase Ticket</h3>
              <p className="text-text-secondary">Buy your ticket through our platform or a verified partner</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-background p-8 rounded-lg text-center relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-text-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-accent">2</div>
              <svg className="w-12 h-12 mx-auto mb-4 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-text-primary text-lg font-medium mb-2">Generate ZK Proof</h3>
              <p className="text-text-secondary">Create a zero-knowledge proof that proves ownership without revealing personal data</p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-background p-8 rounded-lg text-center relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-text-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-accent">3</div>
              <svg className="w-12 h-12 mx-auto mb-4 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-text-primary text-lg font-medium mb-2">Verify & Enter</h3>
              <p className="text-text-secondary">Get verified at the venue instantly with your ZK proof</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="demo" className="bg-gradient-to-br from-surface to-background py-24">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: '100%', label: 'Privacy Preserved' },
              { value: '0.5s', label: 'Verification Time' },
              { value: '0%', label: 'Ticket Fraud' }
            ].map((stat) => (
              <div key={stat.value} className="relative">
                <div 
                  className="text-text-accent text-5xl font-bold mb-2 rounded-lg py-4"
                  style={glowStyle}
                >
                  {stat.value}
                </div>
                <div className="text-text-secondary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">Ready to experience private ticketing?</h2>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Join the future of event ticketing with zero-knowledge proofs protecting your identity while ensuring ticket authenticity.
          </p>
          <a 
            href="#signup"
            className="inline-block px-12 py-4 bg-text-accent text-white rounded-full shadow-accent transition-all duration-DEFAULT transform hover:scale-105 hover:shadow-2xl"
          >
            Get Started
          </a>
        </div>
      </div>

      {/* Technical Details Section */}
      <div className="max-w-5xl mx-auto py-16 px-8">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">Technical Implementation</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-text-primary mb-4">ZK Circuit Overview</h3>
            <pre className="bg-background p-4 rounded text-text-secondary text-sm overflow-x-auto">
              <code>{`// Sample ZK proof generation
const ticketData = {
  eventId: 1337,
  ticketId: 42,
  userCommitment: hash(userEmail)
};

// Generate proof that ticket exists
// without revealing actual ticket details
const proof = generateProof({
  privateInputs: ticketData,
  publicInputs: { eventId: 1337 }
});`}</code>
            </pre>
          </div>
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Built With</h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Mina Protocol / SnarkyJS
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Noir (Aztec) for ZK proof generation
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Circom for circuit design
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                React + Vite frontend
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;