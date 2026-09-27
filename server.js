const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

let latestDrawData = [];

async function startScraper() {
    console.log("🚀 Melancarkan Cloud Puppeteer Scraper...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('GetNoList') || url.includes('GetHistory') || url.includes('WinGo')) {
                try {
                    const json = await response.json();
                    if (json && json.data && Array.isArray(json.data.list)) {
                        latestDrawData = json.data.list.slice(0, 10).map(item => ({
                            period: item.issueNumber || item.period,
                            number: parseInt(item.number),
                            type: parseInt(item.number) >= 5 ? 'BIG' : 'SMALL'
                        }));
                        console.log("✅ Data diserap:", latestDrawData[0]);
                    }
                } catch (e) {}
            }
        });

        console.log("🌐 Membuka laman MZPlay WinGo...");
        await page.goto('https://mzplayb.com/#/home/AllLotteryGames/WinGo?id=1', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        console.log("🔗 Live Scraper Connected!");
    } catch (err) {
        console.error("❌ Ralat Scraper:", err.message);
    }
}

app.get('/api/live-data', (req, res) => {
    res.json({
        success: true,
        count: latestDrawData.length,
        data: latestDrawData
    });
});

app.listen(PORT, () => {
    console.log(`📡 Server running on port ${PORT}`);
    startScraper();
});
                      
