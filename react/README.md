# Gnani - AI Assistant

Gnani is a local, voice-first AI assistant designed for desktop environments. It integrates real-time voice interaction with a robust chat interface, leveraging local LLMs (via Ollama/Whisper) for privacy and speed.

## 🌟 Key Features

### 🎙️ Voice Mode
- **Real-time Voice Interaction**: Wake-word detection ("Hey Gnani") and VAD (Voice Activity Detection).
- **Interactive UI**: A futuristic "Jarvis-like" overlay (`VoiceModeOverlay`) with real-time audio visualization.
- **State Machine Driven**: Robust handling of `Idle` -> `Listening` -> `Thinking` -> `Speaking` states.
- **Barge-in Support**: Interrupt the assistant comfortably while it's speaking.

### 💬 Chat Interface
- **Rich Markdown Support**: Code blocks, tables, and Mermaid diagrams.
- **Branching Conversations**: Edit and branch message history to explore different threads.
- **System Integration**: Access to local files, system stats, and device awareness.

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **State Management**: Zustand, XState
- **Animations**: Framer Motion
- **Desktop**: Electron (IPC integration for Voice/Audio)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Backend Service (Running Python/Electron backend)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## 🧪 Simulation & Testing

For development without hardware access, Gnani includes **Simulation Controls** in the debug panel (`IntelligencePanel`).
See [TESTING.md](./TESTING.md) for details on how to simulate Wake Words and STT inputs.

## 📂 Architecture

For a deep dive into the system architecture, state management, and file structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).
