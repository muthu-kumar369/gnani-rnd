// /react/src/components/gnani/ResponseConsole.tsx
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "gnani";
  text: string;
  isFinal: boolean;
  type?: "partial_text" | "llm_chunk" | "final_text" | "error_message"; // Type of stream event
}

const TypewriterText: React.FC<{ message: Message }> = ({ message }) => {
  const { text, isFinal, sender } = message;
  const characters = Array.from(text);

  // For final messages, just render them without the typewriter effect
  if (isFinal) {
    return <>{text}</>;
  }

  // Stagger animation for typewriter effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.008, delayChildren: 0 }, // Slightly faster stagger
    },
  };
  const childVariants = {
    hidden: { opacity: 0, y: 3 }, // More subtle initial displacement
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="inline">
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          style={
            !isFinal && sender === "gnani"
              ? { textShadow: "0 0 5px rgba(0, 255, 255, 0.5)" } // Subtle glow for typing Gnani
              : {}
          }
        >
          {char}
        </motion.span>
      ))}
      {/* Blinking cursor for non-final messages */}
      {!isFinal && (
        <motion.span
          className="inline-block w-2 h-4 bg-cyan-300 ml-1 rounded-sm" // Rounded cursor
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} // Smoother blink
        />
      )}
    </motion.div>
  );
};

interface ResponseConsoleProps {
  messages: Message[];
}

const ResponseConsole: React.FC<ResponseConsoleProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth", // Smooth scroll
      });
    }
  }, [messages]);

  return (
    <motion.div // Added motion for console div itself
      ref={scrollRef}
      className="w-full h-64 p-4 space-y-4 overflow-y-auto bg-black/40 backdrop-blur-sm rounded-lg"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,255,255,0.5) transparent",
        border: "1px solid", // Dynamic border
        borderColor: "rgba(0,255,255,0.2)",
        boxShadow: "0 0 10px rgba(0,255,255,0.2)", // Subtle glow
      }}
      animate={{
        boxShadow: ["0 0 10px rgba(0,255,255,0.2)", "0 0 15px rgba(0,255,255,0.4)", "0 0 10px rgba(0,255,255,0.2)"],
        borderColor: ["rgba(0,255,255,0.2)", "rgba(0,255,255,0.4)", "rgba(0,255,255,0.2)"],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }} // Subtle scale-in
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }} // Faster transition
          >
            <div className="max-w-3xl">
              <span
                className={`text-xs font-mono uppercase ${
                  msg.sender === "user" ? "text-white/70" : "text-cyan-300/70"
                }`}
              >
                {msg.sender === "user" ? "> User" : "< Gnani"}
              </span>
              <div
                className={`font-mono text-lg ${
                  msg.sender === "user" ? "text-white" : "text-cyan-300"
                }`}
                style={{ textShadow: "0 0 5px" }}
              >
                <TypewriterText message={msg} />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResponseConsole;
