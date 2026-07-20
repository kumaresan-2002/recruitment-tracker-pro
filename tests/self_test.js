const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath == './') filePath = './index.html';
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
    }
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(8123, '127.0.0.1', async () => {
    console.log('Server running at http://127.0.0.1:8123/');
    
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        await page.goto('http://127.0.0.1:8123');

        await page.waitForSelector('#login_username', {timeout: 5000});
        await page.fill('#login_username', 'admin');
        await page.fill('#login_password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        console.log("Testing billingHubView click...");
        await page.evaluate(() => { switchView('billingHubView'); });
        await page.waitForTimeout(500);
        
        const info = await page.evaluate(() => {
            const el = document.getElementById('billingHubView');
            if(!el) return 'Element not found in DOM';
            return {
                className: el.className,
                display: window.getComputedStyle(el).display,
                innerHTML: el.innerHTML.substring(0, 100) + '...'
            };
        });
        
        console.log("Billing Hub State:", info);

        await browser.close();
    } catch(e) {
        console.log("Error during test:", e);
    }
    
    server.close();
    process.exit(0);
});
