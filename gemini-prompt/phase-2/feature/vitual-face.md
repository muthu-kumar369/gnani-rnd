You are assisting as a senior full-stack & realtime avatar systems engineer.  
Your task is to analyze the ENTIRE Gnani project codebase end-to-end, including:

• Electron Shell + React Frontend  
• Mic & audio stream pipeline to backend  
• WebRTC / Web Audio usage  
• STT → LLM → TTS pipeline  
• Realtime streaming UI updates  
• Terminal conversation UI  
• Settings screen  
• Device awareness module  
• Status indicators: idle, listening, thinking, speaking  
• Barge-in implementation  
• EVA (static avatar) code that currently exists  

IMPORTANT RULES:
1. DO NOT BREAK or REMOVE any existing working flow or functionality.
2. If any existing UI/avatar elements are not needed, HIDE them but DO NOT DELETE code.
3. Maintain full compatibility with the current architecture, event flow, hooks, and state machines.
4. All current mic → streaming → STT → LLM → TTS → output UI logic MUST remain intact and unmodified unless improving stability.
5. Every new feature must smoothly integrate into Gnani without disrupting anything that already works.

==========================
YOUR MAIN OBJECTIVE
===========================

You will implement a fully realistic 3D human avatar system inside the GNANI project.  
This must not be a static image, PNG sequence, or 2D sprite.  
You must build a **fully embodied, dynamic, real-time 3D digital human**, similar in quality to:

• Meta Codec Avatars  
• Samsung NEON  
• Reallusion Character Creator avatars  
• Apple Vision Pro Personas  
• Synthesia humans  
• Soul Engine 3D humans  
• Unreal / MetaHuman rigs (WebGL adaptation)

====================================================================
### 1. CRITICAL GOAL
====================================================================

Create a high-fidelity **3D human face and upper body** rendered in real-time using:

• WebGL / three.js  
• A facial rig with blendshapes  
• Real-time viseme-based lip sync  
• Eye tracking  
• Micro-expressions  
• Subtle head motion  
• Breath simulation  
• Face-emotion shaders  
• Dynamic hair movement (optional)  

This avatar must look and behave **exactly like a real human interacting with the user**:
realistic eyes, mouth, breathing, blinking, attachments, shadows, skin softness.

No uncanny valley, no awkward shapes, no low-poly models.

====================================================================
### 2. AVATAR CUSTOMIZATION PATH (FUTURE PROOF)
====================================================================

You must build the system so that later:

User uploads a human photo  
→ GNANI generates a 3D photorealistic version of that person  
→ Avatar behaves exactly like them  

So architecture must support:
• interchangeable 3D head mesh  
• customizable textures (face, hair, skin)  
• interchangeable body rigs  
• rigged morph targets for expression  
• dynamic lighting layers

====================================================================
### 3. BEHAVIORAL STATES (SYNC WITH MIC)
====================================================================

The avatar MUST reflect GNANI’s mic states:

#### IDLE  
• breathing  
• soft blinking  
• relaxed eyes/head  

#### LISTENING  
• head tilt forward  
• focused eyes  
• micro nods  
• subtle eyebrow tension  

#### THINKING  
• eye saccades  
• slight head drift  
• gentle mouth tension  
• processing look  

#### SPEAKING  
• REAL-TIME lip sync using visemes  
• expressive eyebrows  
• matching emotional tone  
• natural head and eye movement  

Smooth transitions between all states (150–300ms).

====================================================================
### 4. LIP SYNC ENGINE (MANDATORY)
====================================================================

You must build a **real-time lip sync system** using:

• Web Audio Analyzer Node  
• phoneme detection OR amplitude-frequency mapping  
• viseme morph targets  
• smooth interpolation  

Avatar’s mouth MUST sync perfectly with GNANI’s TTS output.

====================================================================
### 5. PLACEMENT + UI INTEGRATION
====================================================================

Analyze the entire existing frontend project and:
• choose the ideal place for the 3D avatar  
• it must not look stuffed, awkward, or misaligned  
• must complement the Jarvis theme  
• must not block mic, terminal, settings, or state indicators  
• avatar must be toggleable (show/hide)  

Use a floating hologram-style container but keep the face **realistic**, not stylized.

====================================================================
### 6. STRICT NON-BREAKING RULES
====================================================================

You MUST NOT break:
• mic → VAD → SST → TTS pipeline  
• barge-in (interruption) logic  
• existing UI screens  
• settings screen  
• terminal  
• device awareness  
• audio streaming  
• existing state machines  

Only extend the system.

====================================================================
### 7. DELIVERABLES
====================================================================

You MUST produce:

#### A) New files
• `ThreeDAvatar.tsx`  
• `three-avatar/AvatarScene.ts`  
• `three-avatar/AvatarRig.ts`  
• `three-avatar/LipSyncEngine.ts`  
• `three-avatar/StateAnimationEngine.ts`  
• `three-avatar/AvatarLoader.ts`  
• `three-avatar/CameraAndLighting.ts`  

#### B) 3D Asset Pipeline
• base male & female 3D heads  
• blendshape morph targets (mouth, lips, eyes, brows, cheeks, jaw)  
• high-resolution texture maps  
• hair meshes (optional)  
• idle animations (micro-motions)  

#### C) Rendering System  
3D avatar must be rendered using:
• three.js  
• skinned mesh  
• morph targets  
• WebGL2  
• requestAnimationFrame  

#### D) Avatar Control Panel  
Integrate into Settings:
• select male/female  
• adjust realism level  
• choose emotion style  
• future: upload photo → generate 3D avatar  

#### E) Full integration points  
Exactly where and how to embed the avatar in GNANI UI.

====================================================================
### 8. EXTRA REQUIREMENTS (MANDATORY)
====================================================================

• Avatar must rotate head toward user microphone direction  
• Eyes must track cursor (subtle, realistic)  
• Head micro-movement based on Anderson motion curves  
• Pupils must dilate slightly on speaking/listening  
• Skin must have subtle light scattering (basic SSS effect)  
• Avatar must be GPU optimized → fallback to simplified model on weak GPU  

====================================================================
### 9. FINAL EXPECTATION
====================================================================

Create a **photorealistic 3D human assistant** that feels:
• alive  
• expressive  
• responsive  
• real-time  
• emotionally aware  
• human-like  
• a true partner  

This must be **the most advanced part of GNANI yet**, matching the quality of:
• Meta Project M  
• Samsung NEON  
• Unreal Engine MetaHumans (Web version)  

Proceed.  
