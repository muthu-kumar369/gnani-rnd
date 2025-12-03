# GNANI — Desktop Voice Assistant

# Project Context for LLM (Gemini/ChatGPT)

## 1. Architecture Overview

- This is a Desktop Application using **Electron + React**.
- `/electron` contains:
  - main.js (main process)
  - preload.js
  - IPC handlers
  - electron-wav-recorder (captures microphone audio)
- `/react` contains:
  - UI components
  - Tailwind + Framer Motion
  - Voice interface (Jarvis-style)
  - Controls for wake-word on/off, mic status, responses, logs

## 2. Core Features (Goal)

1. Wake-word detection ("Hey Gnani")
2. Real-time VAD (voice activity detection)
3. Stream microphone chunks to Server API
4. Handle wake → listen → transcribe → think → speak pipeline
5. Display conversation and system status in UI

## 3. Data Flow

MIC → VAD → Wake-word detector → audio chunks → Electron IPC → Backend API (streaming) → response text/tts → Electron → UI

## 4. Coding Rules

- Always generate code with full file paths.
- Use:
  - Node.js + Electron (main)
  - React + Tailwind + Framer Motion (renderer)
- Prefer smaller modular files, avoid giant functions.
- Use IPC channels:
  - `audio:chunk`
  - `wake:triggered`
  - `llm:response`
  - `ui:status`
- Code should follow this structure:
  - Electron handles **mic**, **VAD**, **wake-word**
  - React handles **UI**, **logs**, **animations**
  - Backend handles **speech-to-text**, **AI response**, **TTS**

## 5. DO NOT DO

- Do not rewrite the entire project unless asked
- Do not change architecture
- Keep the context short and repeatable
