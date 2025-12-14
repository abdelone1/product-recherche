// This script runs ON the Alibaba/AliExpress page
function scrapeProduct() {
    let product = {
        title: "",
        image: "",
        price: "",
        weight: "",
        url: window.location.href
    };

    const host = window.location.hostname;

    // === HELPER: Parse price value (handles EU/US formats) ===
    const parsePrice = (text) => {
        if (!text) return 0;
        // Match price patterns
        const matches = text.match(/[\d]+[.,]?\d*/g);
        if (!matches) return 0;

        const prices = matches.map(m => {
            let cleaned = m;
            if (m.includes('.') && m.includes(',')) {
                if (m.lastIndexOf(',') > m.lastIndexOf('.')) {
                    cleaned = m.replace(/\./g, '').replace(',', '.');
                } else {
                    cleaned = m.replace(/,/g, '');
                }
            } else if (m.includes(',')) {
                if (/,\d{2}$/.test(m)) {
                    cleaned = m.replace(',', '.');
                } else {
                    cleaned = m.replace(/,/g, '');
                }
            }
            return parseFloat(cleaned);
        }).filter(n => !isNaN(n) && n > 0 && n < 100000);

        if (prices.length === 0) return 0;
        return Math.max(...prices);
    };

    // === ALIBABA ===
    if (host.includes('alibaba.com')) {

        // 1. TITLE
        const titleSelectors = [
            '.product-title',
            '.product-title h1',
            'h1[data-product-title]',
            'h1'
        ];
        for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) {
                product.title = el.innerText.trim();
                break;
            }
        }

        // 2. IMAGE
        const imgSelectors = [
            '.main-image img',
            '.detail-image img',
            '.gallery-image img',
            'meta[property="og:image"]'
        ];
        for (const sel of imgSelectors) {
            const el = document.querySelector(sel);
            if (el) {
                product.image = el.src || el.content;
                if (product.image && product.image.includes('_50x50')) {
                    product.image = product.image.split('_')[0].replace('.jpg_', '.jpg');
                }
                if (product.image) break;
            }
        }

        // 3. PRICE (multiple strategies)
        const priceSelectors = [
            '.price',
            '.ma-b-price',
            '.uniform-banner-module_price',
            '.product-price-value',
            '.price-current',
            '.pre-inquiry-price',
            '.price-item .price',
            '.ma-ref-price span',
            '.product-price .price',
            '.id-text-highlight-dark',
            '.price-text',
            '[data-spm="price"]'
        ];

        for (const sel of priceSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) {
                // Skip strikethrough prices
                const style = window.getComputedStyle(el);
                if (style.textDecorationLine.includes('line-through')) continue;
                if (el.className.includes('line-through') || el.className.includes('original')) continue;

                const p = parsePrice(el.innerText);
                if (p > 0) {
                    product.price = p;
                    break;
                }
            }
        }

        // Fallback: Regex on page text
        if (!product.price) {
            const text = document.body.innerText;
            const priceMatch = text.match(/US\s*\$\s*([\d,]+\.?\d*)/i);
            if (priceMatch) {
                product.price = parsePrice(priceMatch[1]);
            }
        }

        // Fallback: Meta tag
        if (!product.price) {
            const metaPrice = document.querySelector('meta[property="og:price:amount"]');
            if (metaPrice) product.price = parseFloat(metaPrice.content);
        }

        // 4. WEIGHT
        // Strategy A: Spec rows
        const specRowSelectors = [
            '.spec-row',
            '.do-entry-item',
            '.attribute-item',
            '.product-prop-item'
        ];
        for (const sel of specRowSelectors) {
            const rows = document.querySelectorAll(sel);
            for (const row of rows) {
                const label = (row.querySelector('.name, .do-entry-title, .attr-name')?.innerText || '').toLowerCase();
                if (label.includes('weight') || label.includes('poids') || label.includes('package')) {
                    const valEl = row.querySelector('.value, .do-entry-value, .attr-value');
                    if (valEl) {
                        const valText = valEl.innerText.toLowerCase();
                        const match = valText.match(/([\d.,]+)\s*(kg|g|lb)/i);
                        if (match) {
                            const num = parseFloat(match[1].replace(',', '.'));
                            if (match[2].toLowerCase() === 'kg') product.weight = num * 1000;
                            else if (match[2].toLowerCase() === 'g') product.weight = num;
                            else if (match[2].toLowerCase() === 'lb') product.weight = num * 453.592;
                            break;
                        }
                    }
                }
            }
            if (product.weight) break;
        }

        // Strategy B: Regex on body text
        if (!product.weight) {
            const bodyText = document.body.innerText;
            const weightMatch = bodyText.match(/(?:weight|poids)[:\s]+([\d.,]+)\s*(kg|g|lb)/i) ||
                bodyText.match(/([\d]+[.,]\d{2,3})\s*kg/i);
            if (weightMatch) {
                const num = parseFloat(weightMatch[1].replace(',', '.'));
                const unit = (weightMatch[2] || 'kg').toLowerCase();
                if (unit === 'kg') product.weight = num * 1000;
                else if (unit === 'g') product.weight = num;
                else if (unit === 'lb') product.weight = num * 453.592;
            }
        }

        // === ALIEXPRESS ===
    } else if (host.includes('aliexpress.com')) {
        const titleEl = document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        const imgEl = document.querySelector('.magnifier-image') || document.querySelector('meta[property="og:image"]');
        if (imgEl) product.image = imgEl.src || imgEl.content;

        const priceEl = document.querySelector('.product-price-current') || document.querySelector('.price-current');
        if (priceEl) product.price = parsePrice(priceEl.innerText);

        // Weight (same logic)
        const bodyText = document.body.innerText;
        const weightMatch = bodyText.match(/(?:weight|poids)[:\s]+([\d.,]+)\s*(kg|g|lb)/i);
        if (weightMatch) {
            const num = parseFloat(weightMatch[1].replace(',', '.'));
            const unit = weightMatch[2].toLowerCase();
            if (unit === 'kg') product.weight = num * 1000;
            else if (unit === 'g') product.weight = num;
            else if (unit === 'lb') product.weight = num * 453.592;
        }
    }

    return product;
}

// Listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        const data = scrapeProduct();
        sendResponse(data);
    }
});
