const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:8080');

    // Login
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Click Billing
    await page.evaluate(() => switchView('billingHubView'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'billing_test.png' });

    // Click Data Management
    await page.evaluate(() => switchView('datamanagement'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'datamgt_test.png' });

    await browser.close();
    console.log('Screenshots taken');
})();
