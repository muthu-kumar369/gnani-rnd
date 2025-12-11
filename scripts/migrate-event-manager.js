#!/usr/bin/env node
/**
 * Batch Migration Script for EventManager
 * Migrates remaining window.addEventListener calls to EventManager
 */

const fs = require('fs');
const path = require('path');

const filesToMigrate = [
    // Remaining component files with window.addEventListener
    { file: 'react/src/components/gnani/WaveformLayer.tsx', events: ['resize'] },
    { file: 'react/src/components/gnani/ParticleMotionLayer.tsx', events: ['resize'] },
    { file: 'react/src/components/gnani/AudioManager.tsx', events: ['tts:interrupted'] },
    { file: 'react/src/components/gnani/avatar/RealHumanAvatar.tsx', events: ['mousemove'] },
    { file: 'react/src/components/gnani/avatar/LipSyncEngine.ts', events: ['tts:word'] },
    { file: 'react/src/components/gnani/animations/SpeakingAnimation.tsx', events: ['tts:word'] },
    { file: 'react/src/components/gnani/animations/CoreOrb.tsx', events: ['tts:word'] },
    { file: 'react/src/components/common/DropdownPortal.tsx', events: ['scroll', 'resize'] },
    { file: 'react/src/components/common/LiveRegion.tsx', events: ['announce'] },
    { file: 'react/src/components/common/PluginPermissionDialog.tsx', events: ['plugin-permission-request'] },
    { file: 'react/src/components/conversation/ConversationSidebar.tsx', events: ['folder:drop'] },
    { file: 'react/src/hooks/avatar/useRealLipSync.ts', events: ['tts:word'] },
];

console.log(`\n=== EventManager Migration Script ===\n`);
console.log(`Files to migrate: ${filesToMigrate.length}`);
console.log(`Total event listeners: ${filesToMigrate.reduce((sum, f) => sum + f.events.length, 0)}\n`);

filesToMigrate.forEach(({ file, events }) => {
    console.log(`✓ ${file}`);
    events.forEach(event => console.log(`  - ${event}`));
});

console.log(`\n=== Migration Steps ===\n`);
console.log(`1. Add import: import { eventManager } from '../utils/eventManager';`);
console.log(`2. Replace: window.addEventListener(event, handler)`);
console.log(`   With: eventManager.addEventListener(event, handler, undefined, 'ComponentName')`);
console.log(`3. Replace: window.removeEventListener(event, handler)`);
console.log(`   With: cleanup()`);
console.log(`\n=== End of Script ===\n`);
