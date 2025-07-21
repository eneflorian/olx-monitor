const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeOlxSimple() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const url = 'https://www.olx.ro/imobiliare/case-de-vanzare/sibiu/?currency=EUR';
  console.log(`Testez: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Accept cookies dacă apare bannerul
    try {
      await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
    } catch (e) {}

    // Așteaptă încărcarea anunțurilor
    try {
      await page.waitForSelector("div[data-cy='l-card']", { timeout: 10000 });
      console.log("Găsite elemente div[data-cy='l-card']");
    } catch (e) {
      console.log("Nu s-au găsit anunțuri după 10 secunde");
      await page.screenshot({ path: 'debug-screenshot.png' });
      await browser.close();
      return;
    }

    // Extrage anunțurile din pagină
    const anunturi = await page.evaluate(() => {
      const cards = document.querySelectorAll("div[data-cy='l-card']");
      console.log(`Găsite ${cards.length} carduri în browser`);
      const arr = [];
      cards.forEach((card, index) => {
        const titlu = card.querySelector('h4')?.innerText.trim() || '';
        const pret = card.querySelector('p[data-testid="ad-price"]')?.innerText.replace(/[^0-9]/g, '') || '';
        const locatie = card.querySelector('p[data-testid="location-date"]')?.innerText.split('-')[0].trim() || '';
        const link = card.querySelector('a')?.href || '';
        const img = card.querySelector('img')?.src || '';
        
        console.log(`Card ${index}: titlu="${titlu}", pret="${pret}", link="${link}"`);
        
        if (titlu && pret && link) {
          arr.push({
            titlu,
            pret: parseInt(pret),
            locatie,
            link,
            img,
            categorie: 'imobiliare',
            subcategorie: 'case-vanzare',
            subcategorieNume: 'Case de vanzare',
            oras: 'Sibiu',
            tip: 'Case de vanzare',
          });
        }
      });
      return arr;
    });

    console.log(`Extrase ${anunturi.length} anunțuri`);
    fs.writeFileSync('src/data/anunturi-olx-sibiu.json', JSON.stringify(anunturi, null, 2));

  } catch (error) {
    console.error('Eroare:', error.message);
  }

  await browser.close();
}

scrapeOlxSimple(); 