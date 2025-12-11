import errorLogger from '../utils/errorLogger';

/**
 * Service to handle OAuth operations via Electron IPC
 */
export const oauthService = {
    /**
     * Initiate OAuth flow for a specific provider
     * @param provider The OAuth provider (google, github, etc.)
     * @returns Promise resolving to the auth result
     */
    initiateOAuth: async (provider: string): Promise<any> => {
        const startOAuth = window.gnani?.auth?.startOAuth;

        if (!startOAuth) {
            const error = new Error('OAuth not supported in this environment');
            errorLogger.error('OAuth start failed', error, { context: 'oauthService' });
            throw error;
        }

        try {
            errorLogger.info(`Starting OAuth flow for ${provider}`, { context: 'oauthService' });
            const result = await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                startOAuth(provider)
            ));
            errorLogger.info(`OAuth flow completed for ${provider}`, { context: 'oauthService' });
            return result;
        } catch (error) {
            errorLogger.error(`OAuth flow failed for ${provider}`, error as Error, { context: 'oauthService' });
            throw error;
        }
    }
};
