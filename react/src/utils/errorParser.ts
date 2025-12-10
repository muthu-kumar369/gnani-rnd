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
