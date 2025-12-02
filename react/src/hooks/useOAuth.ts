import { useState, useCallback } from 'react';
import { oauthService } from '../api/oauthService';
import { useUserStore } from '../store/useUserStore';
import { useToast } from '../context/ToastContext';
import errorLogger from '../utils/errorLogger';

export const useOAuth = () => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const { refreshUser } = useUserStore();
    const { addToast } = useToast();

    const linkProvider = useCallback(async (provider: string) => {
        setIsAuthenticating(true);
        try {
            await oauthService.initiateOAuth(provider);
            await refreshUser();
            addToast(`Successfully linked ${provider} account`, 'success');
        } catch (error) {
            errorLogger.error('Failed to link account', error as Error, { context: 'useOAuth' });
            addToast(`Failed to link ${provider} account`, 'error');
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    }, [refreshUser, addToast]);

    return {
        linkProvider,
        isAuthenticating
    };
};
