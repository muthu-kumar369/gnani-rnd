You are assisting as a senior UI/UX engineer with deep knowledge of high-performance, device-friendly visual FX for React + Electron environments.

Your task is to analyze the ENTIRE Gnani frontend project (Electron Shell + React UI + Jarvis themed visuals + mic animation system + status indicators + terminal layer + EVA/Avatar system). You must implement a new FUTURISTIC PARTICLE MOTION LAYER on top of the existing 'Hologram Grid' background.

===========================
CRITICAL RULES
===========================
1. DO NOT break or modify any existing working flow.
2. DO NOT remove any existing code; if something is not needed, HIDE it properly.
3. Mic animation, EVA/Avatar, terminal UI, device awareness, settings screen, and all other features must remain fully functional.
4. Maintain full compatibility with Electron, low-power devices, and the existing rendering pipeline.
5. Ensure extremely low CPU/GPU usage.
6. The central mic animation must remain the primary visual focal point.
7. Maintain the complete Jarvis futuristic theme already implemented.

===========================
OBJECTIVE
===========================
Enhance the current UI background by adding a **subtle, slow-moving particle-motion layer** on top of the existing Futuristic Hologram Grid.

This particle layer must:
• Appear soft, elegant, and very low-density  
• Move slowly to avoid distraction  
• Feel like \"AI activity\" or \"data flow\"  
• Add depth, ambience, and motion  
• Enhance—not overwhelm—the background  
• Maintain clean, premium, professional aesthetics  
• Be lightweight and performant on basic devices  
• Work inside Electron without performance drops  
• Automatically scale particle density based on device capability

Particles should subtly represent:
• continuous AI processing  
• system awareness  
• holographic information flow  
• high-tech environment  

This must feel like a high-end Jarvis console, NOT a game effect.

===========================
ENGINEERING REQUIREMENTS
===========================
Implement the particle layer using:
• Canvas2D or lightweight WebGL fallback  
• Adaptive particle count (detect device performance)  
• Memory-safe loops  
• Strict FPS throttling  
• No heavy shaders  
• No high-density or fast-motion particles  

Integrate the particle system into the existing UI stack:
• It must sit ABOVE the hologram grid  
• It must sit BELOW all interactive UI elements  
• It must NOT interfere with mic animations, state transitions, or EVA  
• It must NOT cause flicker, jank, or delayed rendering  

===========================
WHAT YOU MUST DELIVER
===========================
• Full implementation of the new ParticleMotionLayer component  
• Clean integration into the existing background layout  
• Automatic device-friendly scaling  
• Proper layering/z-index in the UI  
• Comments explaining all major code blocks  
• Performance profiling improvements  
• A fallback mechanism for low-powered devices  
• Instructions on how to toggle this feature ON/OFF if needed  

===========================
NON-DESTRUCTIVE DEVELOPMENT
===========================
You must:
• Analyze existing background components  
• Retain the full working Hologram Grid  
• Add the particle system without replacing or breaking anything  
• Keep the code modular, isolated, and safe  
• Respect the entire project’s state management and file structure  
• Preserve all animations tied to mic: idle/listening/thinking/speaking  

===========================
DELIVERABLE FORMAT
===========================
Generate:
• Complete code implementation  
• Integration changes  
• Refactoring patches  
• Fallback logic  
• Architecture notes  
• Performance notes  

Begin now.

