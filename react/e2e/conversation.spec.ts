import { test, expect } from '@playwright/test';
import { mockElectron } from './lib/mockElectron';

test.describe('Conversation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await mockElectron(page);
    });

    test('should send message and receive response', async ({ page }) => {
        await page.goto('/');

        // Click Terminal button to open terminal if closed (it defaults to closed in some views, checking code: useState(false))
        // GnaniCore.tsx: const [showTerminal, setShowTerminal] = useState(false);
        // Wait, default seems false.
        // I need to click the TERMINAL button.

        await page.click('button:has-text("TERMINAL")');

        // Wait for input
        const input = page.locator('textarea[placeholder*="Type a message"]'); // Placeholder varies, check code? 
        // TerminalPanel uses TextInput.tsx. Placeholder is typically "Type a message..."
        // Or "Message Gnani..."

        // Let's rely on role or existing testid if available. 
        // If not, adding testid is best practice but requires editing code. 
        // I'll try generic selector first.

        // Actually, let's update TextInput component to include testid? 
        // No, user instruction said "write script".
        // I'll use placeholder selector.

        await expect(input).toBeVisible();
        await input.fill('Hello Test');

        // Click Send
        await page.click('button[aria-label="Send message"]');
        // OR keyboard
        // await input.press('Enter');

        // Verify user message appears
        await expect(page.locator('text=Hello Test')).toBeVisible();

        // Verify response (simulated by mockElectron)
        // "Response to: Hello Test"
        await expect(page.locator('text=Response to: Hello Test')).toBeVisible({ timeout: 10000 });

        // "Final: Hello Test"
        await expect(page.locator('text=Final: Hello Test')).toBeVisible();
    });
});
