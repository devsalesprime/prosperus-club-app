// tests/e2e/bottom-nav.spec.ts
// Playwright E2E test for BottomNav visibility and positioning

import { test, expect } from '@playwright/test';

test.describe('BottomNav E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app — login page is OK for nav check on auth'd state
        await page.goto('/app/');
    });

    test('nav #prosperus-bottom-nav is visible on mobile viewport', async ({ page }) => {
        // Set mobile viewport (iPhone 14)
        await page.setViewportSize({ width: 390, height: 844 });

        // Wait for app to load
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');

        // Nav should exist in DOM
        await expect(nav).toBeAttached();

        // Nav should be visible (not hidden by CSS)
        await expect(nav).toBeVisible();
    });

    test('nav contains exactly 5 navigation items', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');
        const items = nav.locator('[role="button"]');

        await expect(items).toHaveCount(5);
    });

    test('nav displays all 5 labels', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');

        const labels = ['Início', 'Agenda', 'Prosperus', 'Sócios', 'Galeria'];
        for (const label of labels) {
            await expect(nav.locator(`text=${label}`)).toBeVisible();
        }
    });

    test('nav is attached to the bottom of the viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');
        const box = await nav.boundingBox();

        expect(box).not.toBeNull();
        if (box) {
            // Nav bottom edge should be at or near the viewport bottom
            // Allow 50px tolerance for safe area padding
            const navBottom = box.y + box.height;
            expect(navBottom).toBeGreaterThan(844 - 50);
            expect(navBottom).toBeLessThanOrEqual(844);
        }
    });

    test('nav is hidden on desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');
        await expect(nav).toBeHidden();
    });

    test('nav has bottom-nav-ios class for safe area handling', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(2000);

        const nav = page.locator('#prosperus-bottom-nav');
        await expect(nav).toHaveClass(/bottom-nav-ios/);
    });
});
