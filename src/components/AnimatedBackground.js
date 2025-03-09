import { motion } from "framer-motion";

function AnimatedBackground() {
  return (
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
  );
}

export default AnimatedBackground;