import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function AnimatedBackground() {
  // Array of monochrome symbols related to tickets and events
  const symbols = ["◯", "◎", "◉", "✧", "✦", "⚪", "◌", "◐", "◑", "⚬"];
  
  // State to hold emoji elements
  const [symbolElements, setSymbolElements] = useState([]);
  
  // Generate random symbols on component mount
  useEffect(() => {
    const elements = [];
    const count = 16; // Number of floating symbols
    
    for (let i = 0; i < count; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const size = Math.random() * 28 + 12; // Random size between 12-40px
      const left = Math.random() * 100; // Random horizontal position
      const top = Math.random() * 100; // Random vertical position
      const delay = Math.random() * 5; // Random delay for animation
      const duration = Math.random() * 12 + 20; // Random duration between 20-32s
      const opacity = Math.random() * 0.2 + 0.05; // Low opacity between 0.05-0.25
      
      elements.push({ 
        id: i, 
        symbol, 
        size, 
        left, 
        top, 
        delay,
        duration,
        opacity
      });
    }
    
    setSymbolElements(elements);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background gradient blobs */}
      <motion.div 
        className="absolute w-[600px] h-[600px] bg-accent opacity-20 blur-3xl rounded-full top-[-100px] left-[-200px]"
        animate={{ 
          scale: [1, 1.2, 1], 
          borderRadius: ["50%", "45%", "50%"],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] bg-primary opacity-20 blur-3xl rounded-full bottom-[-150px] right-[-150px]"
        animate={{ 
          scale: [1, 1.2, 1], 
          borderRadius: ["50%", "40%", "50%"],
          rotate: [0, -5, 0]
        }}
        transition={{ 
          duration: 17, 
          repeat: Infinity, 
          ease: "easeInOut", 
          delay: 1,
          times: [0, 0.5, 1]
        }}
      />
      
      {/* Additional subtle gradient blob */}
      <motion.div 
        className="absolute w-[400px] h-[400px] bg-secondary opacity-10 blur-3xl rounded-full top-[30%] right-[20%]"
        animate={{ 
          scale: [1, 1.3, 1], 
          opacity: [0.05, 0.1, 0.05],
          rotate: [0, 10, 0]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      />
      
      {/* Floating monochrome symbols */}
      {symbolElements.map((item) => (
        <motion.div
          key={item.id}
          className="absolute pointer-events-none select-none text-white font-light"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ 
            y: [0, -120, 0], 
            x: [0, item.id % 2 === 0 ? 40 : -40, 0],
            opacity: [item.opacity, item.opacity * 1.5, item.opacity],
            rotate: [0, item.id % 2 === 0 ? 30 : -30, 0]
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }}
        >
          {item.symbol}
        </motion.div>
      ))}
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-30" />
    </div>
  );
}

export default AnimatedBackground;