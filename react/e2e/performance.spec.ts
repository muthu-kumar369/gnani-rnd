import { test, expect } from '@playwright/test';
import { mockElectron } from './lib/mockElectron';

test.describe('Performance', () => {
    test.beforeEach(async ({ page }) => {
        await mockElectron(page);
    });

    test('terminal toggle should be fast', async ({ page }) => {
        await page.goto('/');

        const startTime = Date.now();
        await page.click('button:has-text("TERMINAL")');
        // Wait for terminal panel
        await expect(page.locator('textarea[placeholder*="Type"]')).toBeVisible();
        const endTime = Date.now();

        console.log(`Terminal Toggle Time: ${endTime - startTime}ms`);
        expect(endTime - startTime).toBeLessThan(500);
    });
});
