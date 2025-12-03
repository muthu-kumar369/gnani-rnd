You will improve the existing Embodied Conversational Agent (ECA) implementation inside the Gnani project.

The current avatar output is awkward, stylized, and not acceptable.  
You MUST completely replace it with a **photorealistic human face** that behaves like a real human during interaction.

===========================
### 🔥 CRITICAL REQUIREMENTS
===========================

### 1. PHOTOREALISTIC HUMAN AGENT (Not cartoon, not 3D mesh)
You must create a **REAL human face** displayed on-screen:
• Natural human skin  
• Natural eyes, nose, mouth, hair  
• Realistic blinking  
• Subtle idle facial motions  
• Smooth head tilts  
• Lifelike expressiveness  

This face must NOT look:
✘ cartoon  
✘ uncanny  
✘ robotic  
✘ stylized  
✘ low-poly  
✘ anime  
✘ emoji-like  

It MUST look like a real human speaking on a video call — but generated and animated in real-time.

You may generate a system that uses:
• pre-rendered photorealistic face layers  
• AI-driven morphing  
• facial rigs  
• keyframe blending  
• WebGL / Canvas rendering  
• viseme-based mouth movement  
but the end result MUST look **photorealistic**.

Provide options:
• Male  
• Female  

Appearance:  
Clean professional look, neutral lighting, mild Jarvis-blue rim lighting overlay.

==========================================
### 2. REAL-TIME LIP SYNC (VISUAL + BEHAVIORAL)
==========================================

You MUST integrate true real-time lip sync:

• Use Web Audio API + analyser node  
• Extract amplitude + frequency  
• Map to **visemes** (AI, O, E, U, Wide, Closed, Rest)  
• Smooth interpolation between frames  
• Mouth must match TTS EXACTLY  
• No delay, no freeze, no jerky movement  

==========================================
### 3. REALISTIC FACIAL EXPRESSIONS BY STATE
==========================================

The human face MUST respond to the assistant mic state machine:

#### IDLE
• Soft breathing  
• Gentle blinking  
• Neutral relaxed face  

#### LISTENING
• Eyebrows slightly raised  
• Head leans forward  
• Focused attentive eyes  
• Subtle listening nod micro-motions  

#### THINKING
• Eyes move slightly upward  
• Eyebrows relax  
• Breathing shifts  
• Subtle processing expression  

#### SPEAKING
• Lip sync active  
• Face becomes expressive  
• Eyes maintain engagement  
• Smooth natural micro-gestures  

Transitions MUST be smooth (150–300ms blend).

==========================================
### 4. ANALYZE GNANI’S EXISTING UI AND PLACE ECA CORRECTLY
==========================================

You must:
• scan entire React project  
• find best UI location for the human agent  
• do NOT break mic, terminal, settings, or theme  
• ensure ECA never overlaps important UI  
• place ECA in a natural, intuitive position  

The agent must be toggleable (show/hide).  
Keep Jarvis hologram glow around frame only — NOT applied directly to the face.

==========================================
### 5. NON-BREAKING RULES (IMPORTANT)
==========================================

You MUST NOT:
✘ break mic → VAD → backend → TTS flow  
✘ modify or remove audio streaming logic  
✘ break barge-in  
✘ alter backend API contracts  
✘ remove terminal or settings logic  
✘ rewrite unrelated components  
✘ introduce blocking heavy rendering  
✘ degrade performance  

Only **ADD** the new ECA system.

==========================================
### 6. IMPLEMENTATION YOU MUST PROVIDE
==========================================

You MUST deliver:

#### A. New components
• `RealHumanAvatar.tsx`  
• `useRealLipSync.ts`  
• `useRealFacialState.ts`  
• `RealHumanAvatarRenderer.ts`  
• `AvatarControls.tsx`  
• `AvatarPreferencesSection.tsx`

#### B. Full integration plan
• file-by-file changes  
• where to add imports  
• how to mount avatar  
• how to sync AvatarState ↔ MicState  

#### C. Photorealistic Face Generation
You MUST provide:
• male base face image set  
• female base face image set  
• multiple facial expressions per state  
• mouth shapes for visemes  
• blinking frames  
• head micro-motion variations  
(All can be generated as high-definition PNG sequences)

#### D. Facial Animation Engine
Explain:
• how to blend frames  
• how to build a simple morphing system  
• how to keep FPS at 30–45  
• how to use requestAnimationFrame for smooth transitions  

#### E. All code (React + HTML Canvas/WebGL)

==========================================
### 7. FINAL OUTPUT
==========================================

Produce:
• A fully photorealistic, natural human-like face ECA  
• Synced to Gnani’s real-time speech  
• Perfect lip sync  
• Intelligent listening/processing/speaking expressions  
• Positioned properly in UI  
• Zero functionality broken  
• Perfect Jarvis-theme integration  

The face MUST look like a real human.
No uncanny valley, no awkward shapes, no stylization.

Proceed.
