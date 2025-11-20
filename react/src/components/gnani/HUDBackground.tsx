// /react/src/components/gnani/HUDBackground.tsx
import React from 'react';
import { motion } from 'framer-motion';

const HUDBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {/* Dynamic Grid */}
      <div
        className="absolute inset-0 bg-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '2rem 2rem',
        }}
      />

      {/* Soft Spotlight Gradients */}
      <div
        className="absolute inset-0 bg-blend-soft-light"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 50%, rgba(0, 100, 100, 0.4), transparent 70%),
            radial-gradient(ellipse at 20% 80%, rgba(0, 50, 150, 0.3), transparent 60%),
            radial-gradient(ellipse at 80% 30%, rgba(50, 0, 100, 0.3), transparent 60%)
          `,
        }}
      />

      {/* Light Streak Motion */}
      <motion.div
        className="absolute top-0 left-0 w-1 h-full bg-cyan-300/30"
        animate={{
          x: ['-100%', '150vw'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
          delay: -5,
        }}
      />
      <motion.div
        className="absolute top-0 right-0 w-2 h-full bg-blue-400/20"
        animate={{
          x: ['100%', '-150vw'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
          delay: 0,
        }}
      />
       <motion.div
        className="absolute bottom-0 left-1/2 w-full h-1 bg-cyan-300/20"
        animate={{
          y: ['-100%', '150vh'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
          delay: -8,
        }}
      />

      {/* Radar Sweep Animation (simplified) */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[150vw] h-[150vw] origin-center"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, transparent 75%, rgba(0, 255, 255, 0.2) 95%, transparent 100%)`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default HUDBackground;
