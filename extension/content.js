// content.js - Injecté dans la page Alibaba

function extractHighestUnitPrice() {
  // Cherche TOUS les éléments textuels
  const elements = [...document.querySelectorAll('body *')]
    .filter(el => {
      const text = el.innerText || '';
      return text.includes('$US') && text.length < 150; // évite les blocs trop longs
    })
    .map(el => el.innerText.trim());

  // Supprime doublons et filtre les lignes vides
  const uniqueLines = [...new Set(elements)].filter(line => line.trim());

  // On va chercher les lignes qui ressemblent à un prix avec MOQ
  let candidatePrice = null;

  for (const line of uniqueLines) {
    // Ex: "12$US", "US $12.50", "49$US MOQ: 2 pièces"
    const priceMatch = line.match(/(?:US\s*\$|\$US)\s*([\d,]+\.?\d*)/i) ||
                       line.match(/([\d,]+\.?\d*)\s*\$US/i);

    if (priceMatch) {
      const priceNum = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (priceNum > 0 && priceNum < 10000) {
        // Vérifie si cette ligne mentionne une petite quantité (≤ 100)
        const hasLowMOQ = /MOQ[:\s]*[1-9][0-9]?(\s*pièces?)?/i.test(line) ||
                          /[1-9][0-9]?\s*(pièces?|pcs)/i.test(line) ||
                          /MOQ[:\s]*1/i.test(line);

        if (hasLowMOQ) {
          return priceNum; // ✅ On a trouvé le prix pour petite quantité → on renvoie immédiatement
        }

        // Sinon, garde en backup le premier prix valide
        if (candidatePrice === null) {
          candidatePrice = priceNum;
        }
      }
    }
  }

  // Si aucun prix avec MOQ faible, on retourne le premier prix valide trouvé
  return candidatePrice;
}

function extractWeightInKg() {
  const text = document.body.innerText;
  // Cherche "X.X kg" ou "X kg" près de "weight", "poids", "package"
  const patterns = [
    /weight[:\s]*([\d.]+)\s*kg/i,
    /poids[:\s]*([\d.]+)\s*kg/i,
    /package.*?(\d+\.?\d*)\s*kg/i,
    /(\d+\.?\d*)\s*kg.*?weight/i,
    /(\d+\.?\d*)\s*kg/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) {
      const kg = parseFloat(match[1]);
      if (kg > 0 && kg < 100) return kg;
    }
  }
  return null;
}

function scrapeProduct() {
  // Vérifie qu'on est sur une fiche produit
  if (!window.location.href.includes('/product-detail/')) {
    console.log('[Scraper] Not a product page');
    return null;
  }

  const titleEl = document.querySelector('.product-title') || document.querySelector('h1');
  const title = titleEl?.innerText?.trim() || '';

  if (!title) return null;

  // Image
  let image = '';
  const imgSelectors = ['.main-image img', 'meta[property="og:image"]', '.gallery-image img'];
  for (const sel of imgSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      image = el.src || el.content || '';
      if (image && image.includes('_50x50')) {
        image = image.split('?')[0].replace(/_\d+x\d+/, '');
      }
      break;
    }
  }

  const price = extractHighestUnitPrice();
  const weight = extractWeightInKg();

  return {
    title,
    image,
    price: price !== null ? price : '',
    weight: weight !== null ? weight : '',
    url: window.location.href
  };
}

// Écoute les messages de l'extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    window.scrollTo(0, 300); // déclenche lazy-load
    setTimeout(() => {
      const data = scrapeProduct();
      console.log("[Alibaba Scraper Result]", data);
      sendResponse(data);
    }, 1500);
    return true; // keep channel open
  }
});