// /react/src/components/gnani/GnaniCore.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MicButton from "./MicButton";
import Waveform from "./Waveform";
import StatusBar from "./StatusBar";
import ResponseConsole from "./ResponseConsole";
import Welcome from "./Welcome";
import useIPC from "../../hooks/useIPC";
import useMicrophone from "../../hooks/useMicrophone";

type AppState = "idle" | "wake" | "listening" | "thinking" | "speaking";
type ConversationTurn = {
  speaker: "user" | "gnani";
  text: string;
};

const GnaniCore: React.FC = () => {
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();
  const {
    on,
    startWakeWord,
    stopWakeWord,
    startVAD,
    stopVAD,
    startStream,
    stopStream
  } = useIPC();

  const [appState, setAppState] = useState<AppState>("idle");
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<
    ConversationTurn[]
  >([]);
  const responseBufferRef = useRef<string>("");

  useEffect(() => {
    if (!on) return;

    const unsubWake = on("wake:triggered", () => {
      setAppState("wake");
      startVAD();
    });
    const unsubListening = on("audio:listening", (isListening: boolean) => {
      setAppState(isListening ? "listening" : "thinking");
      if (isListening) {
        startStream();
        responseBufferRef.current = "";
        setCurrentResponse("");
      } else {
        stopStream();
      }
    });
    const unsubThinking = on("audio:thinking", () => setAppState("thinking"));
    const unsubPartial = on("stream:partial", (payload: { text: string }) => {
      setAppState("speaking");
      responseBufferRef.current += payload.text;
      setCurrentResponse(responseBufferRef.current);
    });
    const unsubFinal = on("stream:final", (payload: { text: string }) => {
      setConversationHistory((prev) => [
        ...prev,
        { speaker: "user", text: "..." },
        { speaker: "gnani", text: payload.text }
      ]);
      setCurrentResponse("");
      responseBufferRef.current = "";
      setAppState("idle");
    });
    const unsubTtsEnded = on("tts:ended", () => setAppState("idle"));
    const unsubError = on("stream:error", (error) => {
      console.error("Streaming Error:", error);
      setAppState("idle");
      stopStream();
      stopVAD();
      stopWakeWord();
    });

    return () => {
      unsubWake?.();
      unsubListening?.();
      unsubThinking?.();
      unsubPartial?.();
      unsubFinal?.();
      unsubTtsEnded?.();
      unsubError?.();
    };
  }, [on, startVAD, stopVAD, startStream, stopStream, stopWakeWord]);

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      stopMic();
      stopWakeWord();
      stopVAD();
      stopStream();
      setAppState("idle");
    } else {
      startMic();
      startWakeWord();
      setAppState("idle");
    }
  }, [
    isMicActive,
    startMic,
    stopMic,
    startWakeWord,
    stopWakeWord,
    startVAD,
    stopVAD,
    stopStream
  ]);

  return (
    <div className="bg-jarvis-bg min-h-dvh min-w-full flex flex-col items-center justify-center text-jarvis-blue font-mono overflow-hidden">
      <AnimatePresence>
        {appState !== "idle" && (
          <motion.div
            className="absolute top-4 left-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StatusBar status={appState} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col items-center justify-center">
        <AnimatePresence>
          {appState === "idle" && <Welcome />}
          {(appState === "listening" ||
            appState === "thinking" ||
            appState === "wake") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
            >
              <Waveform audioLevel={audioLevel} appState={appState} />
            </motion.div>
          )}
        </AnimatePresence>
        <MicButton
          isActive={isMicActive}
          appState={appState}
          onToggle={toggleMic}
        />
        <AnimatePresence>
          {(appState === "speaking" || conversationHistory.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl mt-8"
            >
              <ResponseConsole
                currentResponse={currentResponse}
                history={conversationHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GnaniCore;
