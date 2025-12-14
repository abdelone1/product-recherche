// popup.js - Dans ton popup ou background script

document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = "⏳ Analyse en cours…";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('alibaba.com')) {
    statusDiv.textContent = "❌ Ouvre une fiche produit sur Alibaba.";
    return;
  }

  // Injecte le content script
  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, files: ['content.js'] },
    () => {
      // Envoie la commande de scraping
      chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
        if (response && response.title) {
          statusDiv.textContent = "✅ Produit ajouté !";

          const APP_URL = "https://abdelone1.github.io/product-recherche/";
          const params = new URLSearchParams({
            action: 'add',
            name: response.title,
            image: response.image || '',
            price: response.price.toString(),
            weight: response.weight.toString(),
            link: response.url,
            autosave: 'true'
          });

          chrome.tabs.create({ url: `${APP_URL}?${params}` });
        } else {
          statusDiv.textContent = "❌ Aucun produit détecté (vérifie l’URL).";
        }
      });
    }
  );
});