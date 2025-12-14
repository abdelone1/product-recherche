// This script runs ON the Alibaba/AliExpress page
function scrapeProduct() {
    let product = {
        title: "",
        image: "",
        price: "",
        url: window.location.href
    };

    const host = window.location.hostname;

    if (host.includes('alibaba.com')) {
        // Alibaba Selectors (may need updates as Alibaba changes)
        // Try multiple selectors for robustness

        // Title
        const titleEl = document.querySelector('.product-title h1') || document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        // Image (Main image usually in a gallery or meta tag)
        const imgEl = document.querySelector('.main-image img') || document.querySelector('.detail-image img') || document.querySelector('meta[property="og:image"]');
        if (imgEl) {
            product.image = imgEl.src || imgEl.content;
            // Fix relative URLs or small thumbnails if possible
            if (product.image && product.image.includes('_50x50')) {
                product.image = product.image.replace('_50x50', ''); // Get full size
            }
        }

        // Price
        const priceEl = document.querySelector('.product-price .price') || document.querySelector('.price-text');
        if (priceEl) product.price = priceEl.innerText.replace(/[^0-9.]/g, '');

    } else if (host.includes('aliexpress.com')) {
        // AliExpress Selectors

        // Title
        const titleEl = document.querySelector('h1[data-pl="product-title"]') || document.querySelector('h1');
        if (titleEl) product.title = titleEl.innerText.trim();

        // Image
        const imgEl = document.querySelector('.pdp-info-left .magnifier-image') || document.querySelector('meta[property="og:image"]');
        if (imgEl) product.image = imgEl.src || imgEl.content;

        // Price
        const priceEl = document.querySelector('.product-price-current') || document.querySelector('.price-current');
        if (priceEl) product.price = priceEl.innerText.replace(/[^0-9.]/g, '');
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
