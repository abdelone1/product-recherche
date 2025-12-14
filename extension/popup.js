document.getElementById('scrapeBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = "⏳ Analyse en cours...";

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject script
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, () => {
        // Send message to scrape
        chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
            if (response) {
                statusDiv.textContent = "✅ Trouvé ! Redirection...";

                // Construct URL for local app (Assuming it's hosted at specific URL, user can configure)
                // For now, we use the GitHub Pages URL as default, or localhost for testing
                // Ideally, we open the "Product Research Tool" tab if open, or new one.

                // IMPORTANT: UPDATE THIS URL TO MATCH USER'S DEPLOYED SITE
                const APP_URL = "https://abdelone1.github.io/product-recherche/";

                const queryParams = new URLSearchParams({
                    action: 'add',
                    name: response.title || '',
                    image: response.image || '',
                    price: response.price || '',
                    weight: response.weight || '',
                    link: response.url || '',
                    autosave: 'true'
                }).toString();

                chrome.tabs.create({ url: `${APP_URL}?${queryParams}` });

            } else {
                statusDiv.textContent = "❌ Rien trouvé. (Recharger la page?)";
            }
        });
    });
});
