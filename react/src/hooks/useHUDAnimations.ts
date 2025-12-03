// /react/src/hooks/useHUDAnimations.ts
import { useAnimation } from "framer-motion";

export const useHUDAnimations = () => {
  const controls = useAnimation();

  const animations = {
    glow: {
      boxShadow: [
        "0 0 5px rgba(0, 255, 255, 0.5)",
        "0 0 20px rgba(0, 255, 255, 0.8)",
        "0 0 5px rgba(0, 255, 255, 0.5)",
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
    pulse: (scale = 1.1) => ({
      scale: [1, scale, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    }),
    sweep: {
      rotate: [0, 360],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      },
    },
    energyFlicker: {
      opacity: [1, 0.8, 1, 0.9, 0.7, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
    hologramFloat: {
      y: ["-5px", "5px"],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
    radarRotation: {
      rotate: 360,
      transition: {
        duration: 20,
        loop: Infinity,
        ease: "linear",
      },
    },
    fadeIn: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    fadeOut: {
      opacity: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return { controls, animations };
};
