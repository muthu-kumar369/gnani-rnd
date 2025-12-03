// /react/src/components/gnani/Welcome.tsx
import React from 'react';
import { motion } from 'framer-motion';

const Welcome: React.FC = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl font-bold text-jarvis-blue shadow-jarvis-glow">
        Gnani
      </h1>
      <p className="text-xl text-jarvis-blue mt-4">Your AI Assistant</p>
    </motion.div>
  );
};

export default Welcome;
