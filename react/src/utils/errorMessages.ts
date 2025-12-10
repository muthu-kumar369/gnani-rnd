// Error message mapping with title, message, and action
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
        message: "You've sent too many requests. Please wait a moment before trying again.",
        action: 'Wait'
    },

    // Conversation Errors
    'CONVERSATION_NOT_FOUND': {
        title: 'Conversation Not Found',
        message: "This conversation no longer exists or you don't have access to it.",
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
