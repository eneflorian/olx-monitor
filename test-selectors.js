const puppeteer = require('puppeteer');

async function testSelectors() {
  const browser = await puppeteer.launch({ 
    headless: false, // Pentru debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const url = 'https://www.olx.ro/imobiliare/caut-coleg-camere-de-inchiriat/sibiu/?currency=EUR';
  console.log(`Testez URL: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Accept cookies dacă apare bannerul
    try {
      await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
      console.log('Cookies acceptate');
    } catch (e) {
      console.log('Nu s-au găsit cookies de acceptat');
    }

    // Așteaptă puțin pentru încărcare
    await page.waitForTimeout(3000);
    
    // Găsește toate elementele care ar putea fi anunțuri
    const allPossibleSelectors = await page.evaluate(() => {
      const selectors = [];
      
      // Caută toate div-urile cu clase CSS
      document.querySelectorAll('div[class*="css-"]').forEach((el, index) => {
        if (index < 20) { // Limitează la primele 20
          selectors.push(el.className);
        }
      });
      
      // Caută toate elementele cu data-cy
      document.querySelectorAll('[data-cy]').forEach(el => {
        selectors.push(`[data-cy="${el.getAttribute('data-cy')}"]`);
      });
      
      // Caută toate elementele cu data-testid
      document.querySelectorAll('[data-testid]').forEach(el => {
        selectors.push(`[data-testid="${el.getAttribute('data-testid')}"]`);
      });
      
      return [...new Set(selectors)]; // Elimină duplicatele
    });
    
    console.log('Selectori găsiți pe pagină:', allPossibleSelectors);
    
    // Testează selectori specifice pentru anunțuri
    const selectors = [
      "div[data-cy='l-card']",
      ".css-1sw7q4x",
      ".css-1bbgabe",
      "[data-cy='l-card']",
      "div[data-testid='listing-grid'] div",
      "div[data-testid='ad-card']",
      ".css-1sw7q4x",
      "div[data-cy='l-card']",
      ".css-1sw7q4x",
      "div[data-cy='l-card']"
    ];

    for (const selector of selectors) {
      try {
        const count = await page.$$eval(selector, elements => elements.length);
        console.log(`Selector "${selector}": ${count} elemente găsite`);
        
        if (count > 0) {
          // Testează extragerea datelor
          const testData = await page.evaluate((sel) => {
            const cards = document.querySelectorAll(sel);
            const arr = [];
            cards.forEach((card, index) => {
              if (index < 3) { // Doar primele 3 pentru test
                const titlu = card.querySelector('h6')?.innerText.trim() || 
                             card.querySelector('h4')?.innerText.trim() || 
                             card.querySelector('h5')?.innerText.trim() || '';
                const pret = card.querySelector('p[data-testid="ad-price"]')?.innerText.replace(/[^0-9]/g, '') || 
                            card.querySelector('[data-testid="ad-price"]')?.innerText.replace(/[^0-9]/g, '') || '';
                const locatie = card.querySelector('p[data-testid="location-date"]')?.innerText.split('-')[0].trim() || 
                               card.querySelector('[data-testid="location-date"]')?.innerText.split('-')[0].trim() || '';
                const link = card.querySelector('a')?.href || '';
                const img = card.querySelector('img')?.src || '';
                
                arr.push({ titlu, pret, locatie, link, img });
              }
            });
            return arr;
          }, selector);
          
          console.log('Date extrase:', testData);
        }
      } catch (error) {
        console.log(`Eroare cu selector "${selector}":`, error.message);
      }
    }

    // Testează și alte selectori posibili
    const alternativeSelectors = [
      '.css-1sw7q4x',
      '.css-1bbgabe', 
      '.css-1sw7q4x',
      'div[data-cy="l-card"]',
      '.css-1sw7q4x'
    ];

    console.log('\nTestez selectori alternativi...');
    for (const selector of alternativeSelectors) {
      try {
        const count = await page.$$eval(selector, elements => elements.length);
        console.log(`Selector alternativ "${selector}": ${count} elemente`);
      } catch (error) {
        console.log(`Eroare selector alternativ "${selector}":`, error.message);
      }
    }

  } catch (error) {
    console.error('Eroare la testare:', error.message);
  }

  // Așteaptă 10 secunde pentru a vedea pagina
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

testSelectors(); 