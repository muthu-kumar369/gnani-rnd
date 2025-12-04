# Gnani Production Readiness Report

## 1. Executive Summary

The Gnani application has a solid foundation with a modular Electron architecture and a modern React frontend. The core security settings (`contextIsolation`, `nodeIntegration`) are correctly configured. However, to be considered "production-ready," several critical areas need addressing, particularly regarding **security policies, auto-updates, build optimizations, and native OS integration**.

This report outlines the specific gaps and provides actionable recommendations to elevate the app to production standards without breaking the existing flow.

---

## 2. Electron Main Process Analysis

### ✅ Strengths
*   **Security Core**: `contextIsolation: true` and `nodeIntegration: false` are correctly set, preventing renderer processes from accessing Node.js internals directly.
*   **Modularity**: IPC handlers are well-separated (`ipc/audio`, `ipc/system`, etc.), making the codebase maintainable.
*   **State Persistence**: Uses `electron-store` to remember window bounds, improving user experience.
*   **Error Handling**: Global `uncaughtException` and `unhandledRejection` handlers are in place.

### ⚠️ Critical Gaps for Production
1.  **Content Security Policy (CSP)**:
    *   **Issue**: No CSP header is currently set. This leaves the app vulnerable to XSS attacks if external content is ever loaded or injected.
    *   **Fix**: Configure `session.defaultSession.webRequest.onHeadersReceived` in `main.js` to set a strict CSP (e.g., `script-src 'self'`).

2.  **Single Instance Lock**:
    *   **Issue**: Users can currently open multiple instances of the app, which can cause conflicts with microphone access and global shortcuts.
    *   **Fix**: Use `app.requestSingleInstanceLock()` to ensure only one instance runs.

3.  **Auto-Updater**:
    *   **Issue**: No mechanism to push updates to users.
    *   **Fix**: Integrate `electron-updater` to handle background updates from GitHub Releases or S3.

4.  **Menu Bar Visibility**:
    *   **Issue**: The default Electron menu bar (File, Edit, View) likely appears on Windows/Linux, breaking the custom UI immersion.
    *   **Fix**: Call `mainWindow.setMenu(null)` or build a custom native menu.

---

## 3. Frontend (React/Vite) Analysis

### ✅ Strengths
*   **Modern Stack**: React 18 + Vite + Tailwind CSS is a high-performance combination.
*   **Asset Handling**: Vite handles asset hashing and caching automatically.

### ⚠️ Performance & Optimization Gaps
1.  **Bundle Optimization**:
    *   **Issue**: `vite.config.ts` is basic. Large dependencies (like `framer-motion`, `lucide-react`) might be bundled into a single large chunk, slowing down initial load.
    *   **Fix**: Configure `build.rollupOptions.output.manualChunks` to split vendor libraries into separate chunks.

2.  **Code Compression**:
    *   **Issue**: No Gzip/Brotli compression for static assets.
    *   **Fix**: Add `vite-plugin-compression` to reduce the size of the shipped resources.

3.  **Source Maps**:
    *   **Issue**: Ensure source maps are disabled for production builds (`build.sourcemap: false`) to prevent exposing source code and reduce build size.

---

## 4. Production Metrics & Structure

To monitor the health of a production app, you should track the following metrics (using tools like Sentry or PostHog):

### Key Performance Indicators (KPIs)
*   **Time to Interactive (TTI)**: How long until the app is usable? (Target: < 1.5s)
*   **Memory Usage**: Monitor RAM usage over time. Electron apps are prone to memory leaks. (Target: < 300MB idle)
*   **Crash Rate**: Percentage of sessions ending in a crash. (Target: < 0.1%)
*   **API Latency**: Time taken for STT/LLM responses.

### Recommended Production Structure
```text
gnani-rnd/
├── .github/workflows/    # CI/CD pipelines for build & release
├── electron/
│   ├── main.js           # Main process
│   ├── preload.js        # Context bridge
│   └── updater.js        # [NEW] Auto-update logic
├── react/
│   ├── vite.config.ts    # Optimized build config
│   └── src/
│       └── utils/
│           └── analytics.ts # [NEW] Error/Usage tracking
└── electron-builder.yml  # Detailed build configuration
```

---

## 5. Action Plan (Non-Breaking)

These steps improve quality without altering the user flow:

1.  **Security Hardening**:
    *   Add CSP headers in `main.js`.
    *   Implement Single Instance Lock.
2.  **Build Optimization**:
    *   Update `vite.config.ts` with manual chunks and compression.
    *   Disable source maps for production.
3.  **User Experience**:
    *   Hide default menu bar.
    *   Configure `electron-updater` (scaffolding).

This report provides a roadmap to take Gnani from a "working prototype" to a robust, distributable product.
