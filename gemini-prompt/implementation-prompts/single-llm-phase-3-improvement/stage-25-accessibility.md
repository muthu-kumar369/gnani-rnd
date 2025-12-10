# Stage 25: Accessibility

## Overview
Add comprehensive accessibility support for screen readers and keyboard navigation.

## Implementation Steps

### Step 1: Add ARIA Labels
```tsx
<button
  aria-label="Send message"
  aria-disabled={!input.trim()}
  onClick={handleSend}
>
  <Send size={20} />
</button>

<div role="log" aria-live="polite" aria-atomic="true">
  {messages.map(msg => (
    <div key={msg._id} role="article" aria-label={`${msg.type} message`}>
      {msg.message}
    </div>
  ))}
</div>
```

### Step 2: Keyboard Navigation
```tsx
const useKeyboardNav = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New conversation
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewConversation();
      }
      
      // Ctrl+K: Focus search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        closeAllModals();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### Step 3: Focus Management
```tsx
const FocusTrap = ({ children }) => {
  const trapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const focusableElements = trapRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };
    
    document.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => document.removeEventListener('keydown', handleTab);
  }, []);
  
  return <div ref={trapRef}>{children}</div>;
};
```

### Step 4: Screen Reader Announcements
```tsx
const LiveRegion = () => {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    const handleAnnouncement = (e: CustomEvent) => {
      setAnnouncement(e.detail.message);
      setTimeout(() => setAnnouncement(''), 1000);
    };
    
    window.addEventListener('announce', handleAnnouncement as EventListener);
    return () => window.removeEventListener('announce', handleAnnouncement as EventListener);
  }, []);
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

// Usage
window.dispatchEvent(new CustomEvent('announce', { 
  detail: { message: 'Message sent successfully' }
}));
```

### Step 5: Color Contrast
```css
/* Ensure WCAG AAA compliance */
.text-cyan-400 {
  color: #22d3ee; /* Contrast ratio: 7.5:1 on black */
}

.text-cyan-500 {
  color: #06b6d4; /* Contrast ratio: 4.8:1 on black */
}
```

## Testing Instructions

1. **Screen Reader Test**:
   - Use NVDA/JAWS (Windows) or VoiceOver (Mac)
   - Navigate through conversation
   - ✅ All elements announced correctly

2. **Keyboard Navigation Test**:
   - Unplug mouse
   - Navigate entire app with keyboard
   - ✅ All features accessible

3. **Focus Test**:
   - Tab through all interactive elements
   - ✅ Focus visible and logical order

4. **Color Contrast Test**:
   - Use WAVE or axe DevTools
   - ✅ All text meets WCAG AAA

## Success Criteria
- ✅ WCAG 2.1 AAA compliance
- ✅ Full keyboard navigation
- ✅ Screen reader compatible
- ✅ Focus management works
- ✅ Color contrast meets standards

## Estimated Time: 10 hours
