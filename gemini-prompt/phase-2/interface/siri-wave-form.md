You are assisting as the lead UI/UX engineer for the Gnani AI Assistant (Electron + React), responsible for implementing high-end, futuristic visuals without breaking existing functionality.

Your task is to analyze the ENTIRE existing Gnani frontend project and implement a new FULL-SCREEN, SOFT, ANIMATED WAVEFORM LAYER inspired by Siri’s visual style, but redesigned specifically for the Jarvis-themed Gnani interface.

=================================
CRITICAL RULES
=================================
1. DO NOT break or interfere with ANY existing working flow.
2. DO NOT remove any code — only hide elements if needed.
3. The mic animation must stay as the PRIMARY visual focus.
4. Maintain full compatibility with Electron and low-power devices.
5. The new waveform must be extremely lightweight and efficient.
6. The design MUST fit the current Jarvis hologram aesthetic.
7. All existing mic states (idle, listening, thinking, speaking) must remain untouched.
8. The hologram grid + particle layer + EVA/avatar (if active) must remain fully functional.

=================================
OBJECTIVE
=================================
Add a **full-page, softly animated holographic waveform** background layer that:

• flows smoothly across the entire screen  
• uses soft cyan–blue gradient lines  
• maintains low opacity  
• moves subtly, with a slow fluid motion  
• adds depth, ambience, and futuristic feel  
• enhances the UI without distracting from the mic  
• feels intelligent and alive  
• looks similar to Siri's waveform but more subtle and Jarvis-like  
• scales well on all screen sizes and low-spec hardware  

This waveform should represent:
• background AI awareness  
• ambient system activity  
• energy motion under the interface  

=================================
ENGINEERING REQUIREMENTS
=================================
Implement the waveform with:
• Lightweight Canvas2D or highly optimized WebGL  
• Smooth sine-based or Perlin-noise-based motion  
• Low CPU/GPU usage guaranteed  
• Adaptive performance scaling  
• Accurate z-index layering:
    - BELOW all UI elements  
    - ABOVE the holographic grid background  
    - MUST NOT overlap/interfere with mic animations  

Include:
• opacity control  
• gradient control  
• frame throttling  
• cleanup + proper lifecycle management  

=================================
NON-DESTRUCTIVE WORKFLOW
=================================
You must preserve:
• all existing background elements  
• mic animations and real-time states  
• EVA/Avatar layer (if enabled)  
• particle motion layer  
• conversation terminal  
• device awareness UI  
• settings screen  

If any layout conflict appears:
→ HIDE the conflicting UI safely without deleting it.

=================================
WHAT YOU MUST DELIVER
=================================
Provide:
• Fully implemented WaveformLayer component  
• Integration into the main layout  
• Optimized code  
• Performance tuning  
• Comments explaining architecture  
• Auto device-scaling logic  
• Instructions to toggle this layer ON/OFF  

All code must comply with the existing project stack and structure.

Begin now.

