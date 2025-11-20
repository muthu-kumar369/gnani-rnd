// /react/src/components/gnani/ResponseConsole.tsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

type ConversationTurn = {
  speaker: 'user' | 'gnani';
  text: string;
};

interface ResponseConsoleProps {
  currentResponse: string;
  history: ConversationTurn[];
}

const ResponseConsole: React.FC<ResponseConsoleProps> = ({ currentResponse, history }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history, currentResponse]);

  return (
    <motion.div
      className="w-full p-4 bg-gray-900 bg-opacity-50 border border-jarvis-blue rounded-lg shadow-jarvis-glow max-h-60 overflow-y-auto custom-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {history.map((msg, index) => (
        <p key={index} className={`text-lg whitespace-pre-wrap ${msg.speaker === 'user' ? 'text-gray-400' : 'text-jarvis-blue'} mb-2`}>
          {msg.text}
        </p>
      ))}
      {currentResponse && (
        <p className="text-lg text-jarvis-blue whitespace-pre-wrap">
          {currentResponse}
        </p>
      )}
      <div ref={messagesEndRef} />
    </motion.div>
  );
};

export default ResponseConsole;
