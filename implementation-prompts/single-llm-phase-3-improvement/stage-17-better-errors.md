# Stage 17: Better Error Messages

## Overview
Replace generic error messages with specific, user-friendly messages that include actionable suggestions.

## Current State Analysis

**Current Behavior**:
- Generic errors: "Failed to send message"
- No context or suggestions
- Users don't know how to fix issues

**Target**: Specific, helpful error messages like "Network error. Check your internet connection and try again."

---

## Implementation Steps

### Step 1: Create Error Message Map

**File**: `D:\learning\hey\gnani-rnd\react\src\utils\errorMessages.ts` (NEW)

```typescript
export const ERROR_MESSAGES: Record<string, { title: string; message: string; action?: string }> = {
  // Network Errors
  'NETWORK_ERROR': {
    title: 'Connection Lost',
    message: 'Unable to reach the server. Please check your internet connection.',
    action: 'Retry'
  },
  'TIMEOUT_ERROR': {
    title: 'Request Timeout',
    message: 'The request took too long to complete. The server might be busy.',
    action: 'Try Again'
  },
  
  // Authentication Errors
  'AUTH_EXPIRED': {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'Log In'
  },
  'AUTH_INVALID': {
    title: 'Authentication Failed',
    message: 'Invalid credentials. Please check your email and password.',
    action: 'Retry'
  },
  
  // Rate Limit Errors
  'RATE_LIMIT_EXCEEDED': {
    title: 'Too Many Requests',
    message: 'You\'ve sent too many requests. Please wait a moment before trying again.',
    action: 'Wait'
  },
  
  // Conversation Errors
  'CONVERSATION_NOT_FOUND': {
    title: 'Conversation Not Found',
    message: 'This conversation no longer exists or you don\'t have access to it.',
    action: 'Go Home'
  },
  'MESSAGE_TOO_LONG': {
    title: 'Message Too Long',
    message: 'Your message exceeds the maximum length of 4000 characters.',
    action: 'Shorten Message'
  },
  
  // LLM Errors
  'LLM_ERROR': {
    title: 'AI Processing Error',
    message: 'The AI encountered an error while processing your request.',
    action: 'Regenerate'
  },
  'LLM_TIMEOUT': {
    title: 'Response Timeout',
    message: 'The AI took too long to respond. This might be due to a complex query.',
    action: 'Try Simpler Query'
  },
  
  // File Upload Errors
  'FILE_TOO_LARGE': {
    title: 'File Too Large',
    message: 'The file size exceeds the maximum limit of 10MB.',
    action: 'Choose Smaller File'
  },
  'UNSUPPORTED_FILE_TYPE': {
    title: 'Unsupported File Type',
    message: 'This file type is not supported. Please upload images, PDFs, or text files.',
    action: 'Choose Different File'
  },
  
  // Generic Fallback
  'UNKNOWN_ERROR': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry'
  }
};

export const getErrorMessage = (errorCode: string, fallback?: string): typeof ERROR_MESSAGES[string] => {
  return ERROR_MESSAGES[errorCode] || {
    title: 'Error',
    message: fallback || 'An error occurred',
    action: 'Retry'
  };
};
```

### Step 2: Create Error Parser

**File**: `D:\learning\hey\gnani-rnd\react\src\utils\errorParser.ts` (NEW)

```typescript
import { getErrorMessage } from './errorMessages';

export interface ParsedError {
  code: string;
  title: string;
  message: string;
  action?: string;
  originalError?: any;
}

export const parseError = (error: any): ParsedError => {
  // Handle Axios/Fetch errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Map HTTP status to error code
    if (status === 401) return { ...getErrorMessage('AUTH_EXPIRED'), code: 'AUTH_EXPIRED' };
    if (status === 403) return { ...getErrorMessage('AUTH_INVALID'), code: 'AUTH_INVALID' };
    if (status === 404) return { ...getErrorMessage('CONVERSATION_NOT_FOUND'), code: 'CONVERSATION_NOT_FOUND' };
    if (status === 429) return { ...getErrorMessage('RATE_LIMIT_EXCEEDED'), code: 'RATE_LIMIT_EXCEEDED' };
    if (status === 413) return { ...getErrorMessage('FILE_TOO_LARGE'), code: 'FILE_TOO_LARGE' };
    
    // Check for custom error code in response
    if (data?.errorCode) {
      return { ...getErrorMessage(data.errorCode, data.message), code: data.errorCode };
    }
  }
  
  // Handle network errors
  if (error.message === 'Network Error' || !navigator.onLine) {
    return { ...getErrorMessage('NETWORK_ERROR'), code: 'NETWORK_ERROR' };
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return { ...getErrorMessage('TIMEOUT_ERROR'), code: 'TIMEOUT_ERROR' };
  }
  
  // Fallback
  return { 
    ...getErrorMessage('UNKNOWN_ERROR', error.message), 
    code: 'UNKNOWN_ERROR',
    originalError: error
  };
};
```

### Step 3: Update Error Toast Component

**File**: `D:\learning\hey\gnani-rnd\react\src\components\common\ErrorToast.tsx`

```tsx
import { parseError } from '../../utils/errorParser';

interface ErrorToastProps {
  error: any;
  onRetry?: () => void;
  onDismiss: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onRetry, onDismiss }) => {
  const parsedError = parseError(error);

  return (
    <motion.div className="fixed bottom-4 right-4 z-50 max-w-md bg-red-950/90 border border-red-500/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          {/* Error Title */}
          <h4 className="text-sm font-semibold text-red-100 mb-1">
            {parsedError.title}
          </h4>
          
          {/* Error Message */}
          <p className="text-xs text-red-200/80 mb-3">
            {parsedError.message}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {parsedError.action && onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-400 text-white rounded"
              >
                {parsedError.action}
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded"
            >
              Dismiss
            </button>
          </div>
          
          {/* Error Code (Dev Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-400/60 mt-2">
              Error Code: {parsedError.code}
            </p>
          )}
        </div>

        <button onClick={onDismiss} className="text-red-400 hover:text-red-300">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};
```

### Step 4: Update API Call Error Handling

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts`

```typescript
import { parseError } from '../utils/errorParser';
import { useErrorStore } from './useErrorStore';

sendMessage: async (text, accessToken) => {
  try {
    // ... existing logic ...
  } catch (error) {
    const parsedError = parseError(error);
    
    // Add to error store for toast display
    useErrorStore.getState().addError(
      parsedError.message,
      parsedError.action === 'Retry' ? () => sendMessage(text, accessToken) : undefined
    );
    
    // Log for debugging
    console.error('[SendMessage Error]', {
      code: parsedError.code,
      title: parsedError.title,
      original: parsedError.originalError
    });
    
    throw error;
  }
},
```

### Step 5: Add Backend Error Codes

**File**: `D:\learning\hey\gnani-rnd-backend\src\middleware\error-handler.middleware.ts`

```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Determine error code
  let errorCode = 'UNKNOWN_ERROR';
  let statusCode = 500;
  
  if (err.name === 'ValidationError') {
    errorCode = 'VALIDATION_ERROR';
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    errorCode = 'AUTH_EXPIRED';
    statusCode = 401;
  } else if (err.message?.includes('rate limit')) {
    errorCode = 'RATE_LIMIT_EXCEEDED';
    statusCode = 429;
  }
  
  // Send structured error response
  res.status(statusCode).json({
    success: false,
    errorCode,
    message: err.message || 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

## Testing Instructions

1. **Test Network Error**:
   - Disconnect internet
   - Try to send message
   - ✅ Verify shows "Connection Lost" with "Retry" button

2. **Test Rate Limit**:
   - Send 20 messages rapidly
   - ✅ Verify shows "Too Many Requests" message

3. **Test Auth Error**:
   - Clear access token
   - Try to load conversations
   - ✅ Verify shows "Session Expired" with "Log In" button

4. **Test File Upload Error**:
   - Upload 20MB file
   - ✅ Verify shows "File Too Large" message

5. **Test Unknown Error**:
   - Trigger unexpected error
   - ✅ Verify shows generic message with error code in dev mode

---

## Success Criteria

- ✅ All error types have specific messages
- ✅ Error messages include actionable suggestions
- ✅ Retry buttons work correctly
- ✅ Error codes shown in dev mode
- ✅ No generic "Error" messages in production
- ✅ Users understand what went wrong and how to fix it

---

## Error Message Guidelines

**Good Error Messages**:
- ✅ "Your session expired. Please log in again."
- ✅ "File size exceeds 10MB. Please choose a smaller file."
- ✅ "Network error. Check your connection and try again."

**Bad Error Messages**:
- ❌ "Error 401"
- ❌ "Request failed"
- ❌ "Something went wrong"

---

## Estimated Time: 4 hours
