// /react/src/components/gnani/HUDBackground.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { GnaniAppStatus } from '../../hooks/useGnaniUIState';

interface HUDBackgroundProps {
  status: GnaniAppStatus;
}

const radarVariants = {
  idle: { rotate: 360 },
  thinking: { rotate: 360 },
  responding: { rotate: 360 },
  error: { rotate: 0 },
};

const radarTransition = {
  idle: { duration: 25, repeat: Infinity, ease: 'linear' },
  thinking: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  responding: { duration: 1, repeat: Infinity, ease: 'easeOut' },
  error: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }, // Erratic pulse
};

const spotlightVariants = {
    initial: {
        opacity: 0,
        backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(0, 100, 100, 0.4), transparent 70%),
        radial-gradient(ellipse at 20% 80%, rgba(0, 50, 150, 0.3), transparent 60%),
        radial-gradient(ellipse at 80% 30%, rgba(50, 0, 100, 0.3), transparent 60%)
      `,
    },
    idle: {
        opacity: 1,
        transition: { duration: 2, ease: 'easeInOut' }
    },
    wakeWordListening: {
      opacity: 1,
      backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(255, 165, 0, 0.6), transparent 70%),
        radial-gradient(ellipse at 30% 70%, rgba(255, 140, 0, 0.5), transparent 60%),
        radial-gradient(ellipse at 70% 30%, rgba(255, 100, 0, 0.5), transparent 60%)
      `,
      transition: { duration: 0.8, ease: 'easeOut' }
    },
    micRecording: {
      opacity: 1,
      backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(0, 200, 200, 0.7), transparent 70%),
        radial-gradient(ellipse at 20% 80%, rgba(0, 150, 150, 0.6), transparent 60%),
        radial-gradient(ellipse at 80% 30%, rgba(0, 100, 100, 0.6), transparent 60%)
      `,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
    thinking: {
        opacity: 1,
        backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(150, 200, 255, 0.8), transparent 70%),
        radial-gradient(ellipse at 10% 70%, rgba(100, 150, 255, 0.7), transparent 60%),
        radial-gradient(ellipse at 90% 40%, rgba(120, 80, 255, 0.7), transparent 60%)
      `,
        transition: { duration: 0.5, ease: 'easeInOut' }
    },
    responding: {
        opacity: 1,
        backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(0, 255, 255, 0.9), transparent 70%),
        radial-gradient(ellipse at 30% 80%, rgba(100, 255, 255, 0.8), transparent 60%),
        radial-gradient(ellipse at 70% 20%, rgba(200, 100, 255, 0.8), transparent 60%)
      `,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    error: {
        opacity: 1,
        backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(255, 50, 50, 0.9), transparent 70%),
        radial-gradient(ellipse at 50% 50%, rgba(255, 80, 80, 0.7), transparent 70%)
      `,
        transition: { duration: 0.1, ease: 'easeOut' }
    }
};


const HUDBackground: React.FC<HUDBackgroundProps> = ({ status }) => {
    let currentStatusVariant = 'idle';
    if (status === 'thinking') currentStatusVariant = 'thinking';
    else if (status === 'responding') currentStatusVariant = 'responding';
    else if (status === 'error') currentStatusVariant = 'error';
    else if (status === 'wake-word-listening') currentStatusVariant = 'wakeWordListening';
    else if (status === 'mic-recording' || status === 'streaming' || status === 'receiving-stt') currentStatusVariant = 'micRecording';

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {/* Dynamic Grid */}
      <motion.div
        className="absolute inset-0 bg-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '2rem 2rem',
        }}
        animate={{
          backgroundSize:
            status === 'responding'
              ? ['2rem 2rem', '1.5rem 1.5rem', '2rem 2rem']
              : status === 'thinking'
              ? ['2rem 2rem', '2.2rem 2.2rem', '2rem 2rem']
              : '2rem 2rem',
        }}
        transition={{
          duration: status === 'responding' ? 0.3 : status === 'thinking' ? 1.5 : 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'mirror',
        }}
      />

      {/* Soft Spotlight Gradients */}
       <motion.div
            className="absolute inset-0 bg-blend-soft-light"
            variants={spotlightVariants}
            initial="initial"
            animate={currentStatusVariant}
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
            variants={radarVariants}
            animate={currentStatusVariant}
            transition={radarTransition[currentStatusVariant]}
        />
    </div>
  );
};

export default HUDBackground;
