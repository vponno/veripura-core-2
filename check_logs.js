const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log(`[PAGE UNCAUGHT EXCEPTION]`, error.message);
    });

    console.log('Navigating to https://veripura-core-2-487093021373.us-central1.run.app ...');
    await page.goto('https://veripura-core-2-487093021373.us-central1.run.app', { waitUntil: 'networkidle' });

    await browser.close();
})();
