import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';

function EmojiTicket() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Auto animation when not hovering
  useEffect(() => {
    if (isHovering) return;
    
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      setPosition({
        x: Math.sin(time) * 15,
        y: Math.cos(time * 0.8) * 10
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isHovering]);

  const handleMouseMove = (e) => {
    if (!isHovering) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
    
    setPosition({ x, y });
  };

  return (
    <div 
      className="relative w-full h-48 flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <div 
        className="relative transform transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(800px) rotateX(${position.y}deg) rotateY(${position.x}deg)`
        }}
      >
        <div className="relative flex items-center justify-center w-48 h-32 bg-gradient-to-br from-accent to-primary rounded-xl shadow-lg border-2 border-accent p-4">
          {/* Ticket contents */}
          <div className="absolute top-3 left-3 text-white font-bold">
            AETHER
          </div>
          
          <div className="absolute top-3 right-3">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          
          <div className="text-white text-4xl">🎟️</div>
          
          <div className="absolute bottom-3 left-3 text-white text-xs">
            #A12345
          </div>
          
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-white text-xs">
              VIP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmojiTicket;