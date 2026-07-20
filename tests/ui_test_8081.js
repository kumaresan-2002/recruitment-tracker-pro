const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('http://127.0.0.1:8081');

    // Login
    await page.waitForSelector('#login_username', {timeout: 5000}).catch(e => console.log("Login not found?"));
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Click Billing
    console.log("Switching to billingHubView...");
    await page.evaluate(() => {
        try {
            switchView('billingHubView');
            console.log("switchView called successfully.");
        } catch(e) {
            console.log("switchView Error:", e.toString());
        }
    });
    await page.waitForTimeout(1000);
    
    // Check if it has active class
    const isActive = await page.evaluate(() => {
        const el = document.getElementById('billingHubView');
        return el ? el.className : 'not found';
    });
    console.log("billingHubView class:", isActive);
    
    const displayStyle = await page.evaluate(() => {
        const el = document.getElementById('billingHubView');
        return el ? window.getComputedStyle(el).display : 'not found';
    });
    console.log("billingHubView display:", displayStyle);

    await browser.close();
    console.log('Test completed');
})();
