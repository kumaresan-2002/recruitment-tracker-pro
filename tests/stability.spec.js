
const { test, expect } = require('@playwright/test');

test('Stability Test: Login and Navigating Dashboard', async ({ page }) => {
    // Array to catch unexpected errors in the page context
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    // Navigate to local instance
    await page.goto('http://localhost:8080');
    
    // Login
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 'admin123');
    await page.click('#loginForm button[type="submit"]');
    
    // Ensure dashboard loads and no immediate crash
    await page.waitForTimeout(1000);
    
    // Verify Dashboard active
    const dashVisible = await page.isVisible('#dash_total_reqs');
    expect(dashVisible).toBeTruthy();

    // Click through all Nav Items aggressively
    const navItems = ['requirementsView', 'candidatesView', 'kanbanView', 'talentPoolView', 'interviewsView', 'automationsView'];
    
    for (const view of navItems) {
        // Execute the UI navigation logic
        await page.evaluate(`switchView('${view}')`);
        await page.waitForTimeout(300); // Allow render cycle
    }
    
    // Test Smart JD Modal
    await page.evaluate(`switchView('requirementsView')`);
    await page.click('button:has-text("✨ Smart JD Entry")');
    await page.waitForSelector('#smartJdModal');
    
    // Simulate Smart JD Entry
    await page.fill('#smart_jd_text', 'Role: Senior Developer\nLocation: NY\nRate: 75/hr');
    await page.click('button:has-text("Auto-Fill & Create Requirement")');
    await page.waitForTimeout(1000); // Wait for simulation to finish
    
    // Assert absolutely no JavaScript crashes or Unhandled Rejections occurred
    expect(pageErrors.length).toBe(0);
});
