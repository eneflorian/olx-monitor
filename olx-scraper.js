const puppeteer = require('puppeteer');
const fs = require('fs');

const URL = 'https://www.olx.ro/imobiliare/case-de-vanzare/sibiu/?currency=EUR';

async function scrapeOlx() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Accept cookies dacă apare bannerul
  try {
    await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
  } catch (e) {}

  // Extrage anunțurile din pagină
  const anunturi = await page.evaluate(() => {
    const cards = document.querySelectorAll("div[data-cy='l-card']");
    const arr = [];
    cards.forEach(card => {
      const titlu = card.querySelector('h6')?.innerText.trim() || '';
      const pret = card.querySelector('p[data-testid="ad-price"]')?.innerText.replace(/[^0-9]/g, '') || '';
      const locatie = card.querySelector('p[data-testid="location-date"]')?.innerText.split('-')[0].trim() || '';
      const link = card.querySelector('a')?.href || '';
      const img = card.querySelector('img')?.src || '';
      if (titlu && pret && link) {
        arr.push({
          titlu,
          pret: parseInt(pret),
          locatie,
          link,
          img,
          categorie: 'imobiliare',
          tip: 'Casă',
        });
      }
    });
    return arr;
  });

  await browser.close();
  fs.writeFileSync('src/data/anunturi-olx-sibiu.json', JSON.stringify(anunturi, null, 2));
  console.log(`Salvat ${anunturi.length} anunțuri în src/data/anunturi-olx-sibiu.json`);
}

scrapeOlx(); 