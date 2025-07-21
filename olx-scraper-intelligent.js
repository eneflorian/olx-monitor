const puppeteer = require('puppeteer');
const fs = require('fs');

const ORASE = [
  { nume: 'Sibiu', url: 'sibiu' },
  { nume: 'Alexandria', url: 'alexandria' }
];

const CATEGORII_IMOBILIARE = [
  { id: 'toate', nume: 'Toate din Imobiliare', url: '/imobiliare/' },
  { id: 'internationale', nume: 'Proprietati Internationale', url: '/imobiliare/proprietati-internationale/' },
  { id: 'camere', nume: 'Caut coleg - Camere de inchiriat', url: '/imobiliare/caut-coleg/' },
  { id: 'depozite', nume: 'Depozite si Hale', url: '/imobiliare/industrial/' },
  { id: 'parcari', nume: 'Parcari si Garaje', url: '/imobiliare/paracari-si-garaje/' },
  { id: 'alte', nume: 'Alte proprietati', url: '/imobiliare/alte-proprietati/' },
  { id: 'schimburi', nume: 'Schimburi Imobiliare', url: '/imobiliare/schimburi-imobiliare/' },
  { id: 'birouri', nume: 'Birouri - Spatii comerciale', url: '/imobiliare/birouri-spatii-comerciale/' },
  { id: 'terenuri', nume: 'Terenuri', url: '/imobiliare/terenuri/' },
  { id: 'case-inchiriat', nume: 'Case de inchiriat', url: '/imobiliare/case-de-inchiriat/' },
  { id: 'case-vanzare', nume: 'Case de vanzare', url: '/imobiliare/case-de-vanzare/' },
  { id: 'apartamente-inchiriat', nume: 'Apartamente - Garsoniere de inchiriat', url: '/imobiliare/apartamente-garsoniere-de-inchiriat/' },
  { id: 'apartamente-vanzare', nume: 'Apartamente - Garsoniere de vanzare', url: '/imobiliare/apartamente-garsoniere-de-vanzare/' }
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadExistingData() {
  try {
    const data = fs.readFileSync('src/data/anunturi-olx-sibiu.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      anunturi: [],
      ultimaActualizare: null,
      statistici: { total: 0, noi: 0, expirate: 0 }
    };
  }
}

function saveData(data) {
  fs.writeFileSync('src/data/anunturi-olx-sibiu.json', JSON.stringify(data, null, 2));
}

function isAnuntExpired(timestamp) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(timestamp) < thirtyDaysAgo;
}

function cleanExpiredAnunturi(data) {
  const initialCount = data.anunturi.length;
  data.anunturi = data.anunturi.filter(anunt => !isAnuntExpired(anunt.dataExtragere));
  data.statistici.expirate = initialCount - data.anunturi.length;
  data.statistici.total = data.anunturi.length;
  return data;
}

function findNewAnunturi(existingAnunturi, newAnunturi) {
  const existingLinks = new Set(existingAnunturi.map(a => a.link));
  return newAnunturi.filter(anunt => !existingLinks.has(anunt.link));
}

// Funcție pentru parsarea argumentelor din linia de comandă
function parseArguments() {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  });
  
  return params;
}

async function scrapeOlxIntelligent(params = {}) {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  // Încarcă datele existente
  let data = loadExistingData();
  console.log(`Încărcate ${data.anunturi.length} anunțuri existente`);
  
  // Curăță anunțurile expirate
  data = cleanExpiredAnunturi(data);
  console.log(`Curățate ${data.statistici.expirate} anunțuri expirate`);
  
  let anunturiNoi = [];
  const timestamp = new Date().toISOString();

  // Filtrează orașele și categoriile în funcție de parametri
  const oraseDeExtras = params.oras ? ORASE.filter(o => o.nume.toLowerCase() === params.oras.toLowerCase()) : ORASE;
  const categoriiDeExtras = params.subcategorie ? CATEGORII_IMOBILIARE.filter(c => c.id === params.subcategorie) : CATEGORII_IMOBILIARE;

  console.log(`Extrag pentru: ${oraseDeExtras.map(o => o.nume).join(', ')} - ${categoriiDeExtras.map(c => c.nume).join(', ')}`);

  for (const oras of oraseDeExtras) {
    console.log(`\nExtrag anunțuri din ${oras.nume}...`);
    
    for (const categorie of categoriiDeExtras) {
      const url = `https://www.olx.ro${categorie.url}${oras.url}/?currency=EUR`;
      console.log(`  - ${categorie.nume}: ${url}`);
      console.log(`    Început extragere pentru ${categorie.nume} în ${oras.nume}`);
      
      try {
        console.log(`    Încerc să încarc pagina: ${url}`);
        let retries = 3;
        let loaded = false;
        while (retries > 0 && !loaded) {
          try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            loaded = true;
          } catch (error) {
            retries--;
            console.log(`    Eroare la încărcare (mai am ${retries} încercări): ${error.message}`);
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
              throw error;
            }
          }
        }

        // Accept cookies dacă apare bannerul
        try {
          await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
        } catch (e) {}

        // Verifică dacă pagina s-a încărcat corect
        const pageTitle = await page.title();
        console.log(`    Titlu pagină: ${pageTitle}`);
        
        // Verifică dacă există eroare OLX
        if (pageTitle.includes('Houston') || pageTitle.includes('problem')) {
          console.log(`    Eroare OLX pentru ${categorie.nume} în ${oras.nume} - încearcă din nou`);
          // Încearcă să reîncarci pagina
          await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Verifică dacă există mesaj de eroare sau "nu s-au găsit rezultate"
        const noResults = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('nu s-au găsit') || text.includes('no results') || text.includes('0 anunțuri');
        });
        
        if (noResults) {
          console.log(`    Nu există anunțuri pentru ${categorie.nume} în ${oras.nume}`);
          continue;
        }

        // Așteaptă mai mult pentru încărcare și testează multiple selectori
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Testează multiple selectori pentru anunțuri
        let cardCount = 0;
        let selectorUsed = '';
        
        const selectors = [
          "div[data-cy='l-card']",
          "div[data-testid='l-card']",
          ".css-1sw7q4x",
          "div[data-cy='l-card']",
          ".css-1sw7q4x"
        ];
        
        for (const selector of selectors) {
          try {
            cardCount = await page.$$eval(selector, els => els.length);
            if (cardCount > 0) {
              selectorUsed = selector;
              console.log(`    Găsite ${cardCount} carduri cu selectorul: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (cardCount === 0) {
          console.log(`    Nu s-au găsit anunțuri pentru ${categorie.nume} în ${oras.nume}`);
          continue;
        }

        // Funcție pentru extragerea anunțurilor dintr-o pagină
        const extractAnunturiFromPage = async (pageUrl) => {
          console.log(`      Încarc pagina: ${pageUrl}`);
          let retries = 3;
          let loaded = false;
          while (retries > 0 && !loaded) {
            try {
              await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
              loaded = true;
            } catch (error) {
              retries--;
              console.log(`      Eroare la încărcare (mai am ${retries} încercări): ${error.message}`);
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
              } else {
                throw error;
              }
            }
          }
          
          // Accept cookies dacă apare bannerul
          try {
            await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
          } catch (e) {}

          // Așteaptă încărcarea - OPTIMIZARE pentru 100% acuratețe
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Scroll pentru a declanșa încărcarea anunțurilor lazy-loaded
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Extrage anunțurile și verifică mesajul de arie mai mare în același timp
          let cardCount = 0;
          let selectorUsed = '';
          const selectors = [
            "div[data-cy='l-card']",
            "div[data-testid='l-card']",
            ".css-1sw7q4x"
          ];
          for (const selector of selectors) {
            try {
              cardCount = await page.$$eval(selector, els => els.length);
              console.log(`    Debug: Selector '${selector}' găsește ${cardCount} carduri`);
              if (cardCount > 0) {
                selectorUsed = selector;
                break;
              }
            } catch (e) {
              console.log(`    Debug: Selector '${selector}' a eșuat: ${e.message}`);
              continue;
            }
          }
          
          if (cardCount === 0) {
            console.log(`    Debug: Nu s-au găsit carduri cu niciunul dintre selectorii testați`);
            // Verifică dacă există mesajul "arie mai mare" pe această pagină
            const hasMessage = await page.evaluate(() => {
              const ariaMaiMareElem = Array.from(document.querySelectorAll('body *')).find(el =>
                el.innerText && 
                el.innerText.trim() === 'Uite rezultatele dintr-o arie mai mare de căutare:' &&
                !el.closest('header') && 
                !el.closest('nav') && 
                !el.closest('[role="banner"]') &&
                (el.tagName === 'P' || el.tagName === 'DIV') &&
                el.closest('div[data-testid], div[class*="listing"], div[class*="css-"]')
              );
              return !!ariaMaiMareElem;
            });
            console.log(`    Debug: Mesaj "arie mai mare" pe această pagină: ${hasMessage}`);
            return { anunturiExtrase: [], hasExtendedResults: hasMessage };
          }
          
          const rezultat = await page.evaluate((orasData, categorieData, timestampData, selector) => {
            // Toți cardurile de anunțuri
            const cards = Array.from(document.querySelectorAll(selector));
            
            // Caută explicit elementul cu mesajul "arie mai mare"
            // Căutăm elementul specific din zona de listare, nu din header
            const ariaMaiMareElem = Array.from(document.querySelectorAll('body *')).find(el =>
              el.innerText && 
              el.innerText.trim() === 'Uite rezultatele dintr-o arie mai mare de căutare:' &&
              // Excludem elementele din header/navigation
              !el.closest('header') && 
              !el.closest('nav') && 
              !el.closest('[role="banner"]') &&
              // Căutăm doar elementele în zona de conținut principal
              (el.tagName === 'P' || el.tagName === 'DIV') &&
              // Verificăm că este în zona de listare anunțuri
              el.closest('div[data-testid], div[class*="listing"], div[class*="css-"]')
            );
            
            let stopIndex = cards.length;
            if (ariaMaiMareElem) {
              // Găsește primul card care apare DUPĂ mesaj
              for (let i = 0; i < cards.length; i++) {
                if (ariaMaiMareElem.compareDocumentPosition(cards[i]) & Node.DOCUMENT_POSITION_FOLLOWING) {
                  stopIndex = i;
                  break;
                }
              }
            }
            
            const arr = [];
            for (let i = 0; i < stopIndex; i++) {
              const card = cards[i];
              const titlu = card.querySelector('h4')?.innerText.trim() || '';
              const pret = card.querySelector('p[data-testid="ad-price"]')?.innerText.replace(/[^0-9]/g, '') || '';
              const locatie = card.querySelector('p[data-testid="location-date"]')?.innerText.split('-')[0].trim() || '';
              let link = card.querySelector('a')?.getAttribute('href') || '';
              if (link && !link.startsWith('http')) link = 'https://www.olx.ro' + link;
              const img = card.querySelector('img')?.src || '';
              if (titlu && pret && link) {
                arr.push({
                  titlu,
                  pret: parseInt(pret),
                  locatie,
                  link,
                  img,
                  categorie: 'imobiliare',
                  subcategorie: categorieData.id,
                  subcategorieNume: categorieData.nume,
                  oras: orasData.nume,
                  tip: categorieData.nume,
                  dataExtragere: timestampData,
                  id: link.split('/').pop() || Date.now().toString()
                });
              }
            }
            
            return { 
              anunturiExtrase: arr, 
              hasExtendedResults: !!ariaMaiMareElem,
              debug: {
                totalCards: cards.length,
                hasMessage: !!ariaMaiMareElem,
                stopIndex: stopIndex,
                validAds: arr.length
              }
            };
          }, oras, categorie, timestamp, selectorUsed);
          
          const { anunturiExtrase, hasExtendedResults } = rezultat;
          console.log(`      DEBUG: ${rezultat.debug.totalCards} carduri, mesaj: ${rezultat.debug.hasMessage}, stop la: ${rezultat.debug.stopIndex}, valizi: ${rezultat.debug.validAds}`);
          
          // Returnează anunțurile și dacă trebuie să oprim paginarea
          return { anunturiExtrase, hasExtendedResults };
        };

        // Funcție pentru extragerea anunțurilor cu gestionarea filtrelor pentru birouri
        async function scrapeWithFilters(page, baseUrl, oras, categorie, timestamp) {
          let allAnunturi = [];
          
          // Pentru categoria birouri, avem nevoie să verificăm toate combinațiile de filtre
          if (categorie.id === 'birouri') {
            console.log(`    Categoria birouri detectată - voi aplica filtre specifice`);
            
            // Combinații de filtre pentru birouri
            const filterCombinations = [
              { name: 'Toate anunțurile', url: baseUrl },
              { name: 'Doar particulari + vânzare', url: `${baseUrl}&search%5Bprivate_business%5D=private&search%5Border%5D%5Boffering_type%5D%5B0%5D=offer` },
              { name: 'Doar particulari + închiriere', url: `${baseUrl}&search%5Bprivate_business%5D=private&search%5Border%5D%5Boffering_type%5D%5B0%5D=rent` },
              { name: 'Doar companii + vânzare', url: `${baseUrl}&search%5Bprivate_business%5D=business&search%5Border%5D%5Boffering_type%5D%5B0%5D=offer` },
              { name: 'Doar companii + închiriere', url: `${baseUrl}&search%5Bprivate_business%5D=business&search%5Border%5D%5Boffering_type%5D%5B0%5D=rent` }
            ];
            
            for (const filter of filterCombinations) {
              console.log(`      Aplic filtrul: ${filter.name}`);
              console.log(`      URL: ${filter.url}`);
              
              try {
                const anunturiDinFiltru = await extractAnunturiFromUrl(page, filter.url, oras, categorie, timestamp);
                
                // Adaugă anunțurile fără duplicate
                anunturiDinFiltru.forEach(anunt => {
                  if (!allAnunturi.find(a => a.link === anunt.link)) {
                    allAnunturi.push(anunt);
                  }
                });
                
                console.log(`      Filtru "${filter.name}": ${anunturiDinFiltru.length} anunțuri (total unic: ${allAnunturi.length})`);
                
                // Pauză între filtre
                await delay(2000);
                
              } catch (error) {
                console.error(`      Eroare la filtrul "${filter.name}":`, error.message);
                continue;
              }
            }
            
          } else {
            // Pentru alte categorii, folosește metoda standard
            allAnunturi = await extractAnunturiFromUrl(page, baseUrl, oras, categorie, timestamp);
          }
          
          return allAnunturi;
        }

        // Funcție pentru extragerea anunțurilor dintr-un URL specific
        async function extractAnunturiFromUrl(page, url, oras, categorie, timestamp) {
          let allAnunturi = [];
          let currentPage = 1;
          let hasMorePages = true;
          let totalExpected = 0;

          // Funcție pentru extragerea anunțurilor dintr-o pagină
          const extractAnunturiFromPage = async (pageUrl) => {
            console.log(`        Încarc pagina: ${pageUrl}`);
            let retries = 3;
            let loaded = false;
            while (retries > 0 && !loaded) {
              try {
                await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                loaded = true;
              } catch (error) {
                retries--;
                console.log(`        Eroare la încărcare (mai am ${retries} încercări): ${error.message}`);
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                  throw error;
                }
              }
            }
            
            // Accept cookies dacă apare bannerul
            try {
              await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
            } catch (e) {}

            // Așteaptă încărcarea - OPTIMIZARE pentru 100% acuratețe
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Scroll pentru a declanșa încărcarea anunțurilor lazy-loaded
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Extrage anunțurile și verifică mesajul de arie mai mare în același timp
            let cardCount = 0;
            let selectorUsed = '';
            const selectors = [
              ".css-1sw7q4x", // Cel mai complet - prioritate #1  
              "div[data-cy='l-card']",
              "div[data-testid='l-card']"
            ];
            for (const selector of selectors) {
              try {
                cardCount = await page.$$eval(selector, els => els.length);
                if (cardCount > 0) {
                  selectorUsed = selector;
                  break;
                }
              } catch (e) {
                continue;
              }
            }
            
            if (cardCount === 0) {
              return { anunturiExtrase: [], hasExtendedResults: false };
            }
            
            const rezultat = await page.evaluate((orasData, categorieData, timestampData, selector) => {
              // Toți cardurile de anunțuri cu selector îmbunătățit
              const cards = Array.from(document.querySelectorAll(selector));
              
              // Caută explicit elementul cu mesajul "arie mai mare"
              const ariaMaiMareElem = Array.from(document.querySelectorAll('body *')).find(el =>
                el.innerText && 
                el.innerText.trim() === 'Uite rezultatele dintr-o arie mai mare de căutare:' &&
                !el.closest('header') && 
                !el.closest('nav') && 
                !el.closest('[role="banner"]') &&
                (el.tagName === 'P' || el.tagName === 'DIV') &&
                el.closest('div[data-testid], div[class*="listing"], div[class*="css-"]')
              );
              
                             // OPTIMIZARE: Nu mai oprim la "arie mai mare" - extragem toate anunțurile valide
               let stopIndex = cards.length;
               // Comentez logica de oprire pentru "arie mai mare" pentru acuratețe maximă
               /*
               if (ariaMaiMareElem) {
                 for (let i = 0; i < cards.length; i++) {
                   if (ariaMaiMareElem.compareDocumentPosition(cards[i]) & Node.DOCUMENT_POSITION_FOLLOWING) {
                     stopIndex = i;
                     break;
                   }
                 }
               }
               */
              
              const arr = [];
              for (let i = 0; i < stopIndex; i++) {
                const card = cards[i];
                
                // Selectori îmbunătățiți pentru titlu
                const titlu = card.querySelector('h4')?.innerText.trim() || 
                              card.querySelector('h3')?.innerText.trim() || 
                              card.querySelector('[data-cy="l-card-title"]')?.innerText.trim() || 
                              card.querySelector('a[data-cy="ad-title"]')?.innerText.trim() || '';
                
                // Selectori îmbunătățiți pentru preț
                let pret = card.querySelector('p[data-testid="ad-price"]')?.innerText || 
                          card.querySelector('[data-testid="ad-price"]')?.innerText ||
                          card.querySelector('.css-10b0gli')?.innerText || 
                          card.querySelector('[class*="price"]')?.innerText || '';
                
                // Curăță prețul de caractere non-numerice
                pret = pret.replace(/[^0-9]/g, '') || '';
                
                // Selectori îmbunătățiți pentru link
                let link = card.querySelector('a')?.getAttribute('href') || '';
                if (link && !link.startsWith('http')) {
                  link = 'https://www.olx.ro' + link;
                }
                
                // Selectori îmbunătățiți pentru imagine
                const img = card.querySelector('img')?.src || 
                           card.querySelector('img')?.getAttribute('data-src') || '';
                
                // Validare ultra-relaxată pentru acuratețe maximă - acceptă orice anunț cu titlu și link
                if (titlu && link) {
                  arr.push({
                    titlu,
                    pret: parseInt(pret) || 0, // 0 pentru anunțuri "la cerere"
                    locatie: card.querySelector('p[data-testid="location-date"]')?.innerText.split('-')[0].trim() || '',
                    link,
                    img,
                    categorie: 'imobiliare',
                    subcategorie: categorieData.id,
                    subcategorieNume: categorieData.nume,
                    oras: orasData.nume,
                    tip: categorieData.nume,
                    dataExtragere: timestampData,
                    id: link.split('/').pop() || Date.now().toString()
                  });
                }
              }
              
              return { 
                anunturiExtrase: arr, 
                hasExtendedResults: !!ariaMaiMareElem,
                debug: {
                  totalCards: cards.length,
                  hasMessage: !!ariaMaiMareElem,
                  stopIndex: stopIndex,
                  validAds: arr.length,
                  selectorUsed: selector
                }
              };
            }, oras, categorie, timestamp, selectorUsed);
            
            const { anunturiExtrase, hasExtendedResults } = rezultat;
            console.log(`        DEBUG: Selector '${rezultat.debug.selectorUsed}' - ${rezultat.debug.totalCards} carduri, ${rezultat.debug.validAds} valizi`);
            
            return { anunturiExtrase, hasExtendedResults };
          };

          // Prima pagină pentru a afla totalul de rezultate
          try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Accept cookies dacă apare bannerul
            try {
              await page.click('button[data-testid="accept-cookies"]', { timeout: 2000 });
            } catch (e) {}

            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verifică câte rezultate sunt în total
            try {
              const totalResults = await page.evaluate(() => {
                const text = document.body.innerText;
                const match = text.match(/(\d+)\s+rezultate/);
                return match ? parseInt(match[1]) : 0;
              });
              totalExpected = totalResults;
              console.log(`        Total rezultate așteptate: ${totalExpected}`);
            } catch (e) {
              console.log(`        Nu s-a putut determina numărul total de rezultate`);
            }
          } catch (error) {
            console.error(`        Eroare la încărcarea primei pagini:`, error.message);
            return [];
          }

          // Extrage toate paginile cu protecție îmbunătățită împotriva loop-urilor infinite
          let paginiFaraProgres = 0;
          const maxPaginiFaraProgres = 3;
          let paginiiPrecedente = new Set(); // Pentru a detecta loop-uri de pagini
          let anunturiExtrasePePaginaPrecedenta = 0;
          
          while (hasMorePages && currentPage <= 50) { // Limită maximă de siguranță
            const pageUrl = currentPage === 1 ? url : `${url}&page=${currentPage}`;
            console.log(`        Extrag pagina ${currentPage}`);
            
            // Verifică dacă încercăm să accesăm aceeași pagină în mod repetat
            if (paginiiPrecedente.has(pageUrl)) {
              console.log(`        ATENȚIE: Pagina ${pageUrl} a fost deja procesată - opresc pentru a evita loop-ul`);
              hasMorePages = false;
              break;
            }
            paginiiPrecedente.add(pageUrl);
            
            try {
              const { anunturiExtrase, hasExtendedResults } = await extractAnunturiFromPage(pageUrl);
              const countInainte = allAnunturi.length;
              
              if (!anunturiExtrase || anunturiExtrase.length === 0) {
                console.log(`        Pagina ${currentPage}: Nu s-au găsit anunțuri - opresc extragerea`);
                hasMorePages = false;
              } else {
                // Filtrează duplicatele doar din anunțurile deja extrase în această sesiune
                const anunturiNoi = anunturiExtrase.filter(anuntNou => 
                  !allAnunturi.some(anuntExistent => anuntExistent.link === anuntNou.link)
                );
                
                allAnunturi = allAnunturi.concat(anunturiNoi);
                const anunturiNouPeAceastaPagina = anunturiNoi.length;
                
                console.log(`        Pagina ${currentPage}: ${anunturiExtrase.length} anunțuri extrase, ${anunturiNouPeAceastaPagina} noi după deduplicare`);
                
                // Verifică dacă această pagină are exact același număr de anunțuri ca precedenta (posibil loop)
                if (anunturiExtrase.length === anunturiExtrasePePaginaPrecedenta && anunturiExtrase.length > 0) {
                  console.log(`        ATENȚIE: Pagina ${currentPage} are același număr de anunțuri ca precedenta (${anunturiExtrase.length}) - posibil loop`);
                  paginiFaraProgres++;
                } else {
                  anunturiExtrasePePaginaPrecedenta = anunturiExtrase.length;
                }
                
                // Detectează lipsa de progres pentru a preveni loop-urile infinite
                if (anunturiNouPeAceastaPagina === 0) {
                  paginiFaraProgres++;
                  console.log(`        Atenție: Pagina ${currentPage} nu a adus anunțuri noi (${paginiFaraProgres}/${maxPaginiFaraProgres})`);
                  
                  if (paginiFaraProgres >= maxPaginiFaraProgres) {
                    console.log(`        OPRESC extragerea - ${maxPaginiFaraProgres} pagini consecutive fără progres`);
                    hasMorePages = false;
                    break;
                  }
                } else {
                  paginiFaraProgres = 0; // Reset counter când avem progres
                }
                
                // Verifică dacă mai sunt pagini
                if (anunturiExtrase.length < 40) {
                  console.log(`        Pagina ${currentPage} are mai puțin de 40 anunțuri (${anunturiExtrase.length}) - ultima pagină`);
                  hasMorePages = false;
                } else if (hasExtendedResults) {
                  console.log(`        Pagina ${currentPage}: Găsit mesaj "arie mai mare" - continui să extrag dar voi filtra anunțurile`);
                  currentPage++;
                  await delay(2000);
                } else {
                  currentPage++;
                  await delay(2000);
                }
                
                // Info suplimentare pentru debugging
                if (totalExpected > 0) {
                  console.log(`        Progres: ${allAnunturi.length}/${totalExpected} anunțuri extrase (${((allAnunturi.length/totalExpected)*100).toFixed(1)}%)`);
                }
              }
            } catch (error) {
              console.error(`        Eroare la extragerea paginii ${currentPage}:`, error.message);
              paginiFaraProgres++;
              if (paginiFaraProgres >= maxPaginiFaraProgres) {
                console.log(`        OPRESC extragerea după ${maxPaginiFaraProgres} erori consecutive`);
                hasMorePages = false;
              } else {
                currentPage++;
                await delay(3000);
              }
            }
            
            // Protecție suplimentară: dacă am extras deja foarte multe anunțuri fără să fie în totalExpected
            if (totalExpected > 0 && allAnunturi.length > totalExpected * 1.5) {
              console.log(`        OPRESC extragerea - am depășit semnificativ numărul total așteptat (${allAnunturi.length} > ${totalExpected * 1.5})`);
              hasMorePages = false;
              break;
            }
          }
          
          if (currentPage > 50) {
            console.log(`        OPRESC extragerea - atins limita de siguranță de 50 pagini`);
          }

          return allAnunturi;
        }

        // Extrage toate paginile - ÎNLOCUIEȘTE LOGICA EXISTENTĂ
        console.log(`    Începe extragerea pentru ${categorie.nume} în ${oras.nume}`);
        const allAnunturi = await scrapeWithFilters(page, url, oras, categorie, timestamp);

        console.log(`    Total găsite: ${allAnunturi.length} anunțuri`);
        
        // Găsește anunțurile noi
        // DEDUPLICARE strictă după link
        const uniqueLinks = new Set();
        const allAnunturiDedup = allAnunturi.filter(anunt => {
          if (uniqueLinks.has(anunt.link)) return false;
          uniqueLinks.add(anunt.link);
          return true;
        });
        
        console.log(`    Total DISTINCT: ${allAnunturiDedup.length} anunțuri`);
        
        const anunturiNoiPentruCategorie = findNewAnunturi(data.anunturi, allAnunturiDedup);
        anunturiNoi = anunturiNoi.concat(anunturiNoiPentruCategorie);
        console.log(`    Anunțuri noi: ${anunturiNoiPentruCategorie.length}`);

        // Pauză între cereri
        await delay(2000);

      } catch (error) {
        console.error(`Eroare la ${categorie.nume} în ${oras.nume}:`, error.message);
        continue;
      }
    }
  }

  await browser.close();
  
  // Adaugă anunțurile noi la baza de date
  data.anunturi = data.anunturi.concat(anunturiNoi);
  data.ultimaActualizare = timestamp;
  data.statistici.noi = anunturiNoi.length;
  data.statistici.total = data.anunturi.length;
  
  // Salvează datele
  saveData(data);
  
  console.log(`\n=== REZULTATE ===`);
  console.log(`Anunțuri noi adăugate: ${data.statistici.noi}`);
  console.log(`Anunțuri expirate eliminate: ${data.statistici.expirate}`);
  console.log(`Total anunțuri în baza de date: ${data.statistici.total}`);
  console.log(`Ultima actualizare: ${data.ultimaActualizare}`);
  
  // Salvează și statistici separate
  const stats = {
    ultimaActualizare: timestamp,
    total: data.anunturi.length,
    noi: data.statistici.noi,
    expirate: data.statistici.expirate,
    peOrase: {},
    peCategorii: {}
  };
  
  data.anunturi.forEach(anunt => {
    stats.peOrase[anunt.oras] = (stats.peOrase[anunt.oras] || 0) + 1;
    stats.peCategorii[anunt.subcategorieNume] = (stats.peCategorii[anunt.subcategorieNume] || 0) + 1;
  });
  
  fs.writeFileSync('src/data/statistici-olx.json', JSON.stringify(stats, null, 2));
  console.log('Statistici salvate în src/data/statistici-olx.json');
}

// Parsează argumentele din linia de comandă
const params = parseArguments();

// Rulează extragerea cu parametrii
scrapeOlxIntelligent(params); 