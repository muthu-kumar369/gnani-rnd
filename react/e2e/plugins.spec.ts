import { test, expect } from '@playwright/test';
import { mockElectron } from './lib/mockElectron';

test.describe('Plugin System', () => {
    test.beforeEach(async ({ page }) => {
        await mockElectron(page);
    });

    test.skip('should install plugin with permissions', async ({ page }) => {
        // Skipping because the plugin installation flow requires interacting with the Marketplace UI
        // which might depend on real backend listing.
        // Basic navigation test:
        await page.goto('/');
        await page.click('button:has-text("SETTINGS")');

        // Check if Settings modal opens
        await expect(page.locator('text=Plugin Marketplace')).toBeVisible(); // Might need to switch tab?
        // Tab system in SettingsModal.
    });
});
