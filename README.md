# OLX Scraper - Extractor anunțuri imobiliare

Acest proiect extrage anunțuri imobiliare de pe OLX pentru diverse orașe și categorii din România.

## Funcționalități

- Extrage anunțuri din multiple categorii imobiliare
- Suport pentru multiple orașe
- Filtrare și deduplicare automată
- Interfață web pentru vizualizare și management
- Statistici detaliate
- Salvare automată în format JSON

## Instalare

### 1. Instalare dependențe

```bash
npm install
```

### 2. Instalare Chromium pentru Puppeteer (Linux)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser

# CentOS/RHEL
sudo yum install -y chromium
```

## Utilizare

### 1. Scriptul principal inteligent

```bash
# Extrage toate categoriile pentru toate orașele
node olx-scraper-intelligent.js

# Extrage doar pentru un oraș specific
node olx-scraper-intelligent.js --oras=Sibiu

# Extrage doar o subcategorie specifică
node olx-scraper-intelligent.js --subcategorie=apartamente-vanzare

# Combinații
node olx-scraper-intelligent.js --oras=Sibiu --subcategorie=case-vanzare
```

### 2. Scriptul simplu de test

```bash
node olx-scraper-simple.js
```

### 3. Test selectori

```bash
node test-selectors.js
```

### 4. Aplicația web Next.js

```bash
npm run dev
```

## Subcategorii disponibile

- `toate` - Toate din Imobiliare
- `internationale` - Proprietati Internationale
- `camere` - Caut coleg - Camere de inchiriat
- `depozite` - Depozite si Hale
- `parcari` - Parcari si Garaje
- `alte` - Alte proprietati
- `schimburi` - Schimburi Imobiliare
- `birouri` - Birouri - Spatii comerciale
- `terenuri` - Terenuri
- `case-inchiriat` - Case de inchiriat
- `case-vanzare` - Case de vanzare
- `apartamente-inchiriat` - Apartamente - Garsoniere de inchiriat
- `apartamente-vanzare` - Apartamente - Garsoniere de vanzare

## Orașe disponibile

- `Sibiu`
- `Alexandria`

## API Routes

### GET /api/anunturi
Returnează lista de anunțuri salvate

### GET /api/statistici
Returnează statistici despre anunțuri

### POST /api/extrage
Pornește procesul de extragere

Body:
```json
{
  "subcategorie": "apartamente-vanzare",
  "oras": "Sibiu"
}
```

### POST /api/sterge-subcategorie
Șterge anunțurile dintr-o subcategorie

Body:
```json
{
  "subcategorie": "apartamente-vanzare"
}
```

## Fișiere generate

- `src/data/anunturi-olx-sibiu.json` - Baza de date cu anunțuri
- `src/data/statistici-olx.json` - Statistici

## Buguri rezolvate

1. **Dependențe lipsă** - Adăugat package.json complet
2. **Argumentele din linia de comandă** - Corectată parsarea și validarea
3. **API routes** - Corectați parametrii și gestionarea erorilor
4. **Gestionarea fișierelor** - Adăugată crearea automată a directoarelor
5. **Memory leaks** - Adăugate await-uri lipsă
6. **Configurare Linux** - Optimizat pentru environment-uri headless
7. **Error handling** - Îmbunătățită gestionarea erorilor în toate scripturile

## Troubleshooting

### Chrome/Chromium nu poate fi găsit

```bash
# Setează calea către Chromium
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Probleme cu permisiuni

```bash
# Rulează cu permisiuni de sandbox
export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

### Mode headless pentru servere

```bash
# Forțează mode headless
export HEADLESS=true
node olx-scraper-intelligent.js
```

## Contribuții

Pentru a contribui la acest proiect:

1. Fork repository-ul
2. Creează o ramură pentru feature-ul tău
3. Commit modificările
4. Push către ramură
5. Creează un Pull Request

## Licență

MIT