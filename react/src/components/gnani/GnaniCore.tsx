import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGnaniUIState } from "../../hooks/useGnaniUIState";
import useMicrophone from "../../hooks/useMicrophone";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useIPC } from "../../hooks/useIPC";
import { speakText } from "../../utils/tts";
import errorLogger from "../../utils/errorLogger";

import HUDBackground from "./HUDBackground";
import AIAvatar from "./AIAvatar";
import MicButton from "./MicButton";
import Waveform from "./Waveform";
import StatusBar from "./StatusBar";
import ResponseConsole from "./ResponseConsole";
import IntelligencePanel from "./IntelligencePanel";

const GnaniCore: React.FC = () => {
  const uiState = useGnaniUIState();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const { latestFinalSTT, latestLLMChunk } = useIPC();

  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [accumulatedLLMResponse, setAccumulatedLLMResponse] = useState("");
  const responseEndTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (window.gnani?.auth?.onForceLogout) {
      const handleForceLogout = () => {
        errorLogger.info(
          "Received auth:force-logout from main process. Logging out.",
          { context: "GnaniCore" }
        );
        addToast("Your session has expired. Please log in again.", "error");
        logout();
      };
      const unsubscribe = window.gnani.auth.onForceLogout(handleForceLogout);
      return () => {
        unsubscribe();
      };
    }
  }, [logout, addToast]);

  useEffect(() => {
    if (latestFinalSTT) {
      console.log(`[GnaniCore] Final text received: "${latestFinalSTT}"`);
      // We don't speak the user's final text.
    }
  }, [latestFinalSTT]);

  useEffect(() => {
    if (responseEndTimer.current) {
      clearTimeout(responseEndTimer.current);
    }

    if (latestLLMChunk) {
      console.log(`[GnaniCore] LLM chunk received:`, latestLLMChunk);
      setAccumulatedLLMResponse((prev) => prev + latestLLMChunk);

      responseEndTimer.current = setTimeout(() => {
        if (accumulatedLLMResponse) {
          speakText(accumulatedLLMResponse + latestLLMChunk);
          setAccumulatedLLMResponse("");
        }
      }, 300);
    } else if (accumulatedLLMResponse) {
      speakText(accumulatedLLMResponse);
      setAccumulatedLLMResponse("");
    }

    return () => {
      if (responseEndTimer.current) {
        clearTimeout(responseEndTimer.current);
      }
    };
  }, [latestLLMChunk]);

  const handleStartRecording = () => {
    startMic();
  };

  const handleStopRecording = () => {
    stopMic();
  };

  const currentStatus = uiState.streamErrorMessage
    ? `ERROR: ${uiState.streamErrorMessage}`
    : uiState.isStreamConnected
    ? "STREAMING"
    : "IDLE";

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <HUDBackground status={uiState.appStatus} />

      <motion.div
        className="relative z-10 flex flex-col h-full p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <header className="flex justify-between items-start">
          <div className="text-left">
            <h1
              className="text-2xl font-bold uppercase text-cyan-200"
              style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.7)" }}
            >
              GNANI
            </h1>
            <p className="text-sm text-cyan-400">v2.0 HUD Interface</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-cyan-400">
              WAKE: {uiState.isWakeWordReady ? "READY" : "OFFLINE"}
            </p>
            <p className="text-sm text-cyan-400">
              VAD: {uiState.isVADReady ? "READY" : "OFFLINE"}
            </p>
            <p className="text-sm text-cyan-400">STREAM: {currentStatus}</p>
            <button
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className="mt-2 px-3 py-1 text-xs bg-cyan-800 hover:bg-cyan-700 rounded-full transition-colors"
            >
              {showIntelligencePanel ? "Hide Debug" : "Show Debug"}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
          <AIAvatar status={uiState.appStatus} />
          <div className="w-full max-w-2xl">
            <Waveform
              audioLevel={audioLevel}
              isMicActive={isMicActive}
              status={uiState.appStatus}
            />
          </div>
          <div className="w-full max-w-4xl">
            <ResponseConsole messages={uiState.conversationMessages} />
          </div>
        </main>

        <footer className="w-full absolute bottom-0 left-0 p-4 md:p-8">
          <StatusBar status={uiState.appStatus} />
        </footer>
      </motion.div>

      <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-20">
        <MicButton
          isMicActive={isMicActive}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          status={uiState.appStatus}
        />
      </div>

      <IntelligencePanel isVisible={showIntelligencePanel} />
    </div>
  );
};

export default GnaniCore;
