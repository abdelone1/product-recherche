// This script runs ON the Alibaba/AliExpress page

// === Extract highest price by scanning all visible elements ===
function extractHighestPrice() {
    // 1. Find all price blocks containing "US$" and numbers
    const priceBlocks = [...document.querySelectorAll('*')]
        .filter(el => {
            const text = el.innerText || '';
            return /US\s*\$\s*\d/.test(text) && text.length < 100;
        })
        .map(el => el.innerText.trim());

    // 2. Remove duplicates
    const uniquePrices = [...new Set(priceBlocks)];

    // 3. Extract all prices and return the highest
    let allPrices = [];
    for (const text of uniquePrices) {
        const matches = text.match(/US\s*\$\s*([\d,]+\.?\d*)/gi);
        if (matches) {
            for (const m of matches) {
                const numMatch = m.match(/([\d,]+\.?\d*)/);
                if (numMatch) {
                    const price = parseFloat(numMatch[1].replace(/,/g, ''));
                    if (!isNaN(price) && price > 0 && price < 100000) {
                        allPrices.push(price);
                    }
                }
            }
        }
    }

    // Return highest price (small quantity price)
    return allPrices.length > 0 ? Math.max(...allPrices) : null;
}

// === Extract weight from page ===
function extractWeight() {
    // Strategy 1: Look in spec rows
    const specRowSelectors = ['.spec-row', '.do-entry-item', '.attribute-item', '.product-prop-item'];
    for (const sel of specRowSelectors) {
        const rows = document.querySelectorAll(sel);
        for (const row of rows) {
            const label = (row.querySelector('.name, .do-entry-title, .attr-name')?.innerText || '').toLowerCase();
            if (label.includes('weight') || label.includes('poids') || label.includes('package')) {
                const valEl = row.querySelector('.value, .do-entry-value, .attr-value');
                if (valEl) {
                    const match = valEl.innerText.match(/([\d.,]+)\s*(kg|g|lb)/i);
                    if (match) {
                        const num = parseFloat(match[1].replace(',', '.'));
                        const unit = match[2].toLowerCase();
                        if (unit === 'kg') return num * 1000;
                        if (unit === 'g') return num;
                        if (unit === 'lb') return num * 453.592;
                    }
                }
            }
        }
    }

    // Strategy 2: Regex on body text
    const bodyText = document.body.innerText;
    const weightMatch = bodyText.match(/(?:weight|poids)[:\s]+([\d.,]+)\s*(kg|g|lb)/i) ||
        bodyText.match(/([\d]+[.,]\d{2,3})\s*kg/i) ||
        bodyText.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
        const num = parseFloat(weightMatch[1].replace(',', '.'));
        const unit = (weightMatch[2] || 'kg').toLowerCase();
        if (unit === 'kg') return num * 1000;
        if (unit === 'g') return num;
        if (unit === 'lb') return num * 453.592;
    }

    return null;
}

// === Main scrape function ===
function scrapeProduct() {
    let product = {
        title: "",
        image: "",
        price: "",
        weight: "",
        url: window.location.href
    };

    const host = window.location.hostname;

    if (host.includes('alibaba.com')) {
        // Check if we're on a product detail page
        if (!window.location.href.includes('/product-detail/') &&
            !window.location.href.includes('/product/')) {
            console.log('[Scraper] Not a product page');
        }

        // 1. TITLE
        product.title = document.querySelector('.product-title')?.innerText?.trim() ||
            document.querySelector('h1')?.innerText?.trim() || '';

        // 2. IMAGE
        const imgSelectors = ['.main-image img', '.detail-image img', '.gallery-image img', 'meta[property="og:image"]'];
        for (const sel of imgSelectors) {
            const el = document.querySelector(sel);
            if (el) {
                product.image = el.src || el.content || '';
                if (product.image && product.image.includes('_50x50')) {
                    product.image = product.image.split('_')[0].replace('.jpg_', '.jpg');
                }
                if (product.image) break;
            }
        }

        // 3. PRICE - Use robust extraction
        product.price = extractHighestPrice() || '';

        // 4. WEIGHT
        product.weight = extractWeight() || '';

    } else if (host.includes('aliexpress.com')) {
        product.title = document.querySelector('h1')?.innerText?.trim() || '';

        const imgEl = document.querySelector('.magnifier-image') || document.querySelector('meta[property="og:image"]');
        if (imgEl) product.image = imgEl.src || imgEl.content || '';

        product.price = extractHighestPrice() || '';
        product.weight = extractWeight() || '';
    }

    return product;
}

// === Message listener ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        // Scroll to trigger lazy-load
        window.scrollTo(0, 300);

        // Wait for content to load, then scrape
        setTimeout(() => {
            const data = scrapeProduct();
            console.log('[Alibaba Scraped]', data);
            sendResponse(data);
        }, 500);

        return true; // Keep message channel open for async response
    }
});
