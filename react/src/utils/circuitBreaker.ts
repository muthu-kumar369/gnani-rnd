import { logger } from './logger';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
    threshold?: number;      // Number of failures before opening
    timeout?: number;        // Time in ms before attempting half-open
    resetTimeout?: number;   // Time in ms before resetting failure count
}

/**
 * CircuitBreaker - Protects against cascading failures
 * Stage 4 Task 4.8: Circuit Breaker for External Services
 */
export class CircuitBreaker {
    private state: CircuitState = 'closed';
    private failures = 0;
    private threshold: number;
    private timeout: number;
    private resetTimeout: number;
    private resetTimer?: NodeJS.Timeout;
    private openTimer?: NodeJS.Timeout;
    private name: string;

    constructor(name: string, options: CircuitBreakerOptions = {}) {
        this.name = name;
        this.threshold = options.threshold || 5;
        this.timeout = options.timeout || 60000; // 1 minute
        this.resetTimeout = options.resetTimeout || 10000; // 10 seconds
    }

    /**
     * Execute function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            const error = new Error(`Circuit breaker is open for ${this.name}`);
            logger.warn('Circuit breaker open', {
                circuit: this.name,
                failures: this.failures
            });
            throw error;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error as Error);
            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    private onSuccess() {
        // Reset failure count after successful call
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }

        this.resetTimer = setTimeout(() => {
            this.failures = 0;
        }, this.resetTimeout);

        if (this.state === 'half-open') {
            logger.info('Circuit breaker closed', {
                circuit: this.name
            });
            this.state = 'closed';
            this.failures = 0;
        }
    }

    /**
     * Handle failed execution
     */
    private onFailure(error: Error) {
        this.failures++;

        logger.error('Circuit breaker failure', error, {
            circuit: this.name,
            failures: this.failures,
            threshold: this.threshold
        });

        if (this.failures >= this.threshold) {
            this.open();
        }
    }

    /**
     * Open the circuit
     */
    private open() {
        this.state = 'open';

        logger.error('Circuit breaker opened', new Error('Threshold exceeded'), {
            circuit: this.name,
            failures: this.failures,
            threshold: this.threshold
        });

        if (this.openTimer) {
            clearTimeout(this.openTimer);
        }

        this.openTimer = setTimeout(() => {
            this.halfOpen();
        }, this.timeout);
    }

    /**
     * Move to half-open state
     */
    private halfOpen() {
        this.state = 'half-open';
        this.failures = 0;

        logger.info('Circuit breaker half-open', {
            circuit: this.name
        });
    }

    /**
     * Get current state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get failure count
     */
    getFailures(): number {
        return this.failures;
    }

    /**
     * Reset circuit breaker
     */
    reset() {
        this.state = 'closed';
        this.failures = 0;

        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        if (this.openTimer) {
            clearTimeout(this.openTimer);
        }

        logger.info('Circuit breaker reset', {
            circuit: this.name
        });
    }
}

// Create circuit breakers for common services
export const apiCircuitBreaker = new CircuitBreaker('API', {
    threshold: 5,
    timeout: 60000
});

export const llmCircuitBreaker = new CircuitBreaker('LLM', {
    threshold: 3,
    timeout: 120000
});

export const searchCircuitBreaker = new CircuitBreaker('Search', {
    threshold: 5,
    timeout: 60000
});
