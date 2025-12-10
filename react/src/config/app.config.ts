// STAGE 1: Centralized frontend configuration
interface AppConfig {
    apiUrl: string;
    apiVersion: string;
    grpcUrl: string;
    environment: 'development' | 'production';
    features: {
        offlineMode: boolean;
        analytics: boolean;
        plugins: boolean;
    };
    limits: {
        maxFileSize: number;
        maxMessageLength: number;
        maxConversations: number;
    };
}

const getConfig = (): AppConfig => {
    const env = import.meta.env.MODE || 'development';

    return {
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
        apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
        grpcUrl: import.meta.env.VITE_GRPC_URL || 'localhost:50051',
        environment: env as 'development' | 'production',
        features: {
            offlineMode: import.meta.env.VITE_FEATURE_OFFLINE === 'true',
            analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
            plugins: import.meta.env.VITE_FEATURE_PLUGINS === 'false', // Disabled for now
        },
        limits: {
            maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
            maxMessageLength: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || '10000'),
            maxConversations: parseInt(import.meta.env.VITE_MAX_CONVERSATIONS || '100'),
        },
    };
};

export const config = getConfig();
export default config;
