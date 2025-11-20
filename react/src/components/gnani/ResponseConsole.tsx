// /react/src/components/gnani/ResponseConsole.tsx
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "../../hooks/useIPC";

interface ResponseConsoleProps {
  messages: Message[];
}

const TypewriterText: React.FC<{ message: Message }> = ({ message }) => {
  const { text, isFinal } = message;
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
      transition: { staggerChildren: 0.01, delayChildren: 0 },
    },
  };
  const childVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {characters.map((char, index) => (
        <motion.span key={index} variants={childVariants}>
          {char}
        </motion.span>
      ))}
      {/* Blinking cursor for non-final messages */}
      {!isFinal && (
        <motion.span
          className="inline-block w-2 h-4 bg-cyan-300 ml-1"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.div>
  );
};

const ResponseConsole: React.FC<ResponseConsoleProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="w-full h-64 p-4 space-y-4 overflow-y-auto bg-black/40 backdrop-blur-sm border border-cyan-300/20 rounded-lg"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,255,255,0.5) transparent",
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
    </div>
  );
};

export default ResponseConsole;
