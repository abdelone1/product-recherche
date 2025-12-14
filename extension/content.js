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

    // Helper to extract numbers from text
    const extractPrice = (text) => {
        if (!text) return 0;
        // Clean text: enable regex to find all float-like patterns
        const matches = text.match(/([0-9.,]+)/g);
        if (!matches) return 0;

        // Convert to numbers, filtering out non-prices
        const prices = matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => !isNaN(n));

        if (prices.length === 0) return 0;

        // User wants "Smallest Quantity" price. 
        // In a range "$5.00 - $10.00", the small quantity is $10.00.
        // In tiers, usually the first price listed is the small quantity price.
        return Math.max(...prices);
    };

    // Helper to extract weight in grams
    const extractWeight = () => {
        // Look for common content in specification tables
        const keywords = ['weight', 'poids', 'single gross weight', 'package weight'];
        let foundText = '';

        // Strategy 1: Look in DL/DT/DD or Table rows
        const cells = document.querySelectorAll('td, dt, th, span.attr-name');
        for (let cell of cells) {
            const text = cell.innerText.toLowerCase();
            if (keywords.some(k => text.includes(k))) {
                // Try to find the value in the next sibling or separate element
                if (cell.tagName === 'DT') {
                    const dd = cell.nextElementSibling;
                    if (dd && dd.tagName === 'DD') foundText = dd.innerText;
                } else if (cell.tagName === 'TH' || cell.tagName === 'TD') {
                    const next = cell.nextElementSibling;
                    if (next) foundText = next.innerText;
                } else if (cell.classList.contains('attr-name')) {
                    const val = cell.nextElementSibling || cell.parentElement.querySelector('.attr-value');
                    if (val) foundText = val.innerText;
                }

                if (foundText) break;
            }
        }

        // Parse found weight
        if (foundText) {
            const lower = foundText.toLowerCase();
            const num = parseFloat(lower.replace(/[^0-9.]/g, ''));
            if (!isNaN(num)) {
                if (lower.includes('kg')) return num * 1000;
                if (lower.includes('g') && !lower.includes('kg')) return num;
                if (lower.includes('lb')) return num * 453.592;
            }
        }
        return "";
    };

    if (host.includes('alibaba.com')) {
        // --- ALIBABA SCAPING ---

        // 1. Title
        const titleEl = document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        // 2. Image
        const imgEl = document.querySelector('.main-image img') ||
            document.querySelector('.detail-image img') ||
            document.querySelector('meta[property="og:image"]');
        if (imgEl) {
            product.image = imgEl.src || imgEl.content;
            if (product.image && product.image.includes('_50x50')) {
                product.image = product.image.split('_')[0].replace('.jpg_', '.jpg'); // clean Alibaba thumbnails
            }
        }

        // 3. Price
        // Attempt to find the specific price blocks first (Ladder pricing)
        let rawPriceText = "";
        const priceElements = document.querySelectorAll('.price-item .price, .ma-ref-price span, .product-price .price');

        if (priceElements.length > 0) {
            // Usually the first one corresponds to the smallest MOQ (highest price)
            rawPriceText = priceElements[0].innerText;
        } else {
            // Fallback to meta string
            const metaPrice = document.querySelector('meta[property="og:price:amount"]');
            if (metaPrice) rawPriceText = metaPrice.content;
        }

        if (rawPriceText) {
            product.price = extractPrice(rawPriceText);
        }

        // 4. Weight
        product.weight = extractWeight();


    } else if (host.includes('aliexpress.com')) {
        // --- ALIEXPRESS SCAPING ---
        const titleEl = document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        const imgEl = document.querySelector('.magnifier-image') || document.querySelector('meta[property="og:image"]');
        if (imgEl) product.image = imgEl.src || imgEl.content;

        const priceEl = document.querySelector('.product-price-current') || document.querySelector('.price-current');
        if (priceEl) product.price = extractPrice(priceEl.innerText);

        product.weight = extractWeight();
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
