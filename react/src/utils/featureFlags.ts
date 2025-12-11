import { logger } from './logger';

interface FeatureConfig {
    enabled: boolean;
    fallback?: string;
}

/**
 * Feature flags for graceful degradation
 * Stage 4 Task 4.9: Graceful Degradation
 */
export const features: Record<string, FeatureConfig> = {
    advancedSearch: {
        enabled: true,
        fallback: 'basicSearch'
    },
    hybridSearch: {
        enabled: true,
        fallback: 'textSearch'
    },
    vectorMemory: {
        enabled: true,
        fallback: 'simpleMemory'
    },
    sessionReplay: {
        enabled: true,
        fallback: 'none'
    },
    analytics: {
        enabled: true,
        fallback: 'none'
    }
};

/**
 * Execute with fallback on failure
 */
export async function withFallback<T>(
    feature: keyof typeof features,
    primary: () => Promise<T>,
    fallback: () => Promise<T>
): Promise<T> {
    const config = features[feature];

    if (!config || !config.enabled) {
        logger.info('Feature disabled, using fallback', {
            feature,
            fallback: config?.fallback
        });
        return fallback();
    }

    try {
        return await primary();
    } catch (error: any) {
        logger.warn('Feature failed, using fallback', {
            feature,
            error: error.message,
            fallback: config.fallback
        });
        return fallback();
    }
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
    return features[feature]?.enabled ?? false;
}

/**
 * Enable a feature
 */
export function enableFeature(feature: keyof typeof features) {
    if (features[feature]) {
        features[feature].enabled = true;
        logger.info('Feature enabled', { feature });
    }
}

/**
 * Disable a feature
 */
export function disableFeature(feature: keyof typeof features) {
    if (features[feature]) {
        features[feature].enabled = false;
        logger.warn('Feature disabled', {
            feature,
            fallback: features[feature].fallback
        });
    }
}

/**
 * Get all feature statuses
 */
export function getFeatureStatuses() {
    return Object.entries(features).map(([name, config]) => ({
        name,
        enabled: config.enabled,
        fallback: config.fallback
    }));
}
