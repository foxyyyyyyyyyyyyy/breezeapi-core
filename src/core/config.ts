import { BreezeAPI } from '../index';

export class Config {
    /**
     * Set a config value by key.
     */
    static set<T = any>(key: string, value: T): void {
        BreezeAPI.config(key, value);
    }

    /**
     * Get a config value by key.
     */
    static get<T = any>(key: string): T | undefined {
        return BreezeAPI.config(key) as T | undefined;
    }

    /**
     * Register a config object with a unique key property.
     */
    static register<T = any>(config: { key: string; value: T }): void {
        BreezeAPI.config(config);
    }
}