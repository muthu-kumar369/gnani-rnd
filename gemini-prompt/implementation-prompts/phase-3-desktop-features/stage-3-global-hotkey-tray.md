# Stage 3: Global Hotkey & System Tray

## Objective

Implement desktop-native features: global hotkey for quick activation and system tray for always-available access.

---

## Context

**Current**: Must click app window to activate mic  
**Desired**: Press Ctrl+Shift+Space from anywhere to activate  
**Constraints**: Must not conflict with OS shortcuts, must be customizable

---

## Implementation Prompt

### Part 1: Global Hotkey

**Task**: Register global hotkey using Electron `globalShortcut` API.

**Backend (Electron Main Process)**:

```javascript
// electron/main.js
const { globalShortcut } = require('electron');

function registerGlobalHotkey() {
  // Default: Ctrl+Shift+Space (customizable in settings)
  const hotkey = store.get('globalHotkey') || 'CommandOrControl+Shift+Space';
  
  const success = globalShortcut.register(hotkey, () => {
    logger.info(`Global hotkey ${hotkey} pressed`);
    
    // Show window if hidden
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      
      // Trigger mic activation
      mainWindow.webContents.send('hotkey:activate-mic');
    }
  });
  
  if (!success) {
    logger.error(`Failed to register global hotkey: ${hotkey}`);
  } else {
    logger.info(`Global hotkey registered: ${hotkey}`);
  }
}

// In main() function
app.whenReady().then(() => {
  registerGlobalHotkey();
});

// Cleanup on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

**Frontend**:

```typescript
// src/hooks/useGlobalHotkey.ts
useEffect(() => {
  const handleHotkeyActivate = () => {
    // Activate mic if not already active
    if (!isMicActive) {
      startMic();
    }
  };
  
  window.gnani?.on('hotkey:activate-mic', handleHotkeyActivate);
  return () => window.gnani?.off('hotkey:activate-mic', handleHotkeyActivate);
}, [isMicActive, startMic]);
```

**Settings UI**:
- Add hotkey customization in Settings modal
- Use `electron-localshortcut` for validation
- Show current hotkey, allow change
- Warn if conflicts with OS shortcuts

**Files**:
- `electron/main.js` (MODIFY)
- `electron/ipc/system.js` (MODIFY - add hotkey IPC)
- `src/hooks/useGlobalHotkey.ts` (NEW)
- `src/components/settings/HotkeySettings.tsx` (NEW)

---

### Part 2: System Tray

**Task**: Add system tray icon with context menu.

**Implementation**:

```javascript
// electron/main.js
const { Tray, Menu } = require('electron');
let tray = null;

function createTray() {
  // Use appropriate icon for platform
  const iconPath = process.platform === 'darwin' 
    ? path.join(__dirname, 'assets/tray-icon-mac.png')
    : path.join(__dirname, 'assets/tray-icon.png');
  
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Activate Mic',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('hotkey:activate-mic');
      }
    },
    { type: 'separator' },
    {
      label: 'Recent Conversations',
      submenu: [] // Populated dynamically
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('open:settings');
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Gnani AI Assistant');
  
  // Click to show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// In main()
app.whenReady().then(() => {
  createTray();
});
```

**Dynamic Menu Updates**:
- Update "Recent Conversations" submenu when conversations change
- Show last 5 conversations
- Click to resume conversation

**Files**:
- `electron/main.js` (MODIFY)
- `electron/assets/tray-icon.png` (NEW)
- `electron/assets/tray-icon-mac.png` (NEW)

---

## Testing

- [ ] Global hotkey activates mic from any app
- [ ] Hotkey can be customized in settings
- [ ] System tray icon appears
- [ ] Tray menu shows recent conversations
- [ ] Click tray to show/hide window

---

## Success Criteria

- [ ] Hotkey works on Windows, macOS, Linux
- [ ] Tray icon matches OS style
- [ ] No conflicts with OS shortcuts
- [ ] Settings allow customization
