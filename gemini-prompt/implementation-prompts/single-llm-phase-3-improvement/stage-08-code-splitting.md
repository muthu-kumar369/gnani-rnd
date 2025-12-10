# Stage 8: Code Splitting & Lazy Loading

## Overview
Implement route-based code splitting and lazy loading to reduce initial bundle size.

## Implementation Steps

### Step 1: Add React.lazy for Routes

```tsx
// App.tsx
import { lazy, Suspense } from 'react';

const ChatLayout = lazy(() => import('./layouts/ChatLayout'));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatLayout />} />
      </Routes>
    </Suspense>
  );
}
```

### Step 2: Lazy Load Heavy Components

```tsx
const TerminalPanel = lazy(() => import('./components/terminal/TerminalPanel'));
const ConversationSidebar = lazy(() => import('./components/conversation/ConversationSidebar'));
```

### Step 3: Add Loading Fallbacks

```tsx
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-black">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
  </div>
);
```

### Step 4: Configure Vite for Code Splitting

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'store': ['zustand'],
        }
      }
    }
  }
});
```

## Success Criteria
- ✅ Initial bundle < 500KB
- ✅ Routes load on demand
- ✅ Smooth loading transitions
- ✅ No flash of unstyled content

## Estimated Time: 8 hours
