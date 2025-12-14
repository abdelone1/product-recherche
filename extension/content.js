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
    const extractPrice = (element) => {
        if (!element) return 0;

        // 1. FILTER: Ignore strikethrough/discounted original prices
        // Check class names for "line-through", "original", "deleted"
        // check style text-decoration
        const style = window.getComputedStyle(element);
        if (style.textDecorationLine.includes('line-through') ||
            element.className.includes('line-through') ||
            element.className.includes('original-price')) {
            return 0;
        }

        // Also check if any parent up to 3 levels is strikethrough
        let parent = element.parentElement;
        for (let i = 0; i < 3; i++) {
            if (parent) {
                const pStyle = window.getComputedStyle(parent);
                if (pStyle.textDecorationLine.includes('line-through') ||
                    parent.className.includes('line-through')) {
                    return 0;
                }
                parent = parent.parentElement;
            }
        }

        const text = element.innerText;
        // Match price patterns: $12.82, 12,82€, 12.82, etc.
        const matches = text.match(/[\d]+[.,]?\d*/g);
        if (!matches) return 0;

        const prices = matches.map(m => {
            // Handle European format: 12,82 -> 12.82
            // Handle thousands: 1,234.56 or 1.234,56
            let cleaned = m;
            // If has both . and , determine which is decimal
            if (m.includes('.') && m.includes(',')) {
                // 1,234.56 (US) or 1.234,56 (EU)
                if (m.lastIndexOf(',') > m.lastIndexOf('.')) {
                    // EU format: 1.234,56
                    cleaned = m.replace(/\./g, '').replace(',', '.');
                } else {
                    // US format: 1,234.56
                    cleaned = m.replace(/,/g, '');
                }
            } else if (m.includes(',')) {
                // Could be 1,234 (thousands) or 12,82 (EU decimal)
                // If comma is followed by exactly 2 digits at end, it's EU decimal
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

    // Helper to extract weight in grams
    const extractWeight = () => {
        const keywords = ['weight', 'poids', 'single gross weight', 'package weight', 'gross weight'];
        let foundText = '';

        // Strategy 1: Look in DL/DT/DD or Table rows (Standard Spec Table)
        const cells = document.querySelectorAll('td, dt, th, span.attr-name');
        for (let cell of cells) {
            const text = cell.innerText.toLowerCase();
            if (keywords.some(k => text.includes(k))) {
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

        // Strategy 2: Text Content Search (for div-based layouts like Tailwind)
        // Find ALL elements communicating a label
        if (!foundText) {
            const allElements = document.querySelectorAll('div, span, p, label');
            for (let el of allElements) {
                // Optimization: Skip elements with too much text (likely container)
                if (el.innerText.length > 50) continue;

                const text = el.innerText.toLowerCase();
                // If specific keyword found exactly or closely
                if (keywords.some(k => text === k || text === k + ':')) {
                    // Look at Next Sibling
                    const next = el.nextElementSibling;
                    if (next) {
                        foundText = next.innerText;
                        break;
                    }
                    // Look at Parent's text content (if structure is <div>Label: Value</div>)
                    if (el.parentElement) {
                        foundText = el.parentElement.innerText;
                        break;
                    }
                }
            }
        }

        // Strategy 3: Heavy Scan for "0.000 kg" pattern in specific content areas
        if (!foundText) {
            const specAreas = document.querySelectorAll('.do-entry-list, .attributes-list, .product-info, #specs-list, .detail-decorate-list, .product-prop-list');
            for (let area of specAreas) {
                const text = area.innerText;
                const match = text.match(/(\d+[.,]?\d*)\s*(kg|g|lb|kilogram|gram)\b/i);
                if (match) {
                    foundText = match[0];
                    break;
                }
            }
        }

        // Strategy 4: Full page scan (last resort)
        if (!foundText) {
            const bodyText = document.body.innerText;
            // Look for patterns like "Weight: 0.5 kg" or "0.500kg"
            const weightPatterns = [
                /weight[:\s]+(\d+[.,]?\d*)\s*(kg|g|lb)/i,
                /poids[:\s]+(\d+[.,]?\d*)\s*(kg|g|lb)/i,
                /(\d+[.,]\d{2,3})\s*kg/i,  // 0.500 kg
            ];
            for (let pattern of weightPatterns) {
                const match = bodyText.match(pattern);
                if (match) {
                    foundText = match[0];
                    break;
                }
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
        const titleEl = document.querySelector('.product-title h1') || document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        // 2. Image
        const imgEl = document.querySelector('.main-image img') ||
            document.querySelector('.detail-image img') ||
            document.querySelector('meta[property="og:image"]');
        if (imgEl) {
            product.image = imgEl.src || imgEl.content;
            if (product.image && product.image.includes('_50x50')) {
                product.image = product.image.split('_')[0].replace('.jpg_', '.jpg');
            }
        }

        // 3. Price (Robust)
        // Collect all potential price containers
        const priceCandidates = document.querySelectorAll(
            '.price-item .price, .ma-ref-price span, .product-price .price, .id-text-highlight-dark, .price-text'
        );

        // Extract logical max from VALID elements
        let maxPrice = 0;
        priceCandidates.forEach(el => {
            const p = extractPrice(el);
            if (p > maxPrice) maxPrice = p;
        });

        if (maxPrice > 0) {
            product.price = maxPrice;
        } else {
            // Fallback to meta
            const metaPrice = document.querySelector('meta[property="og:price:amount"]');
            if (metaPrice) product.price = parseFloat(metaPrice.content);
        }

        // 4. Weight
        product.weight = extractWeight();


    } else if (host.includes('aliexpress.com')) {
        // --- ALIEXPRESS SCAPING ---
        const titleEl = document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        const imgEl = document.querySelector('.magnifier-image') || document.querySelector('meta[property="og:image"]');
        if (imgEl) product.image = imgEl.src || imgEl.content;

        // Price
        const priceEl = document.querySelector('.product-price-current') || document.querySelector('.price-current');
        if (priceEl) product.price = extractPrice(priceEl);

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
