const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:8080');
    
    // Type username and password
    await page.type('#login_username', 'admin');
    await page.type('#login_password', 'admin123');
    
    // Click submit
    await page.click('#loginForm button[type="submit"]');
    
    // Wait a bit for potential errors
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("TEST FINISHED");
    await browser.close();
})();
