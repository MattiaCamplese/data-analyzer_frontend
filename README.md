# Data Analyzer

Piattaforma web per la visualizzazione, l'analisi e il confronto di report di sicurezza su domini. Permette di monitorare il risk score di ogni dominio, esplorare scansioni storiche, confrontare snapshot e identificare trend di rischio nel tempo.

---

## Indice

- [Stack tecnologico](#stack-tecnologico)
- [Struttura del progetto](#struttura-del-progetto)
- [Autenticazione](#autenticazione)
- [Dashboard](#dashboard)
- [Pagina Report](#pagina-report)
- [Pagina Confronto](#pagina-confronto)
- [Pagina 404](#pagina-404)
- [Visualizzazioni e grafici](#visualizzazioni-e-grafici)
- [Internazionalizzazione](#internazionalizzazione)
- [Gestione dello stato](#gestione-dello-stato)
- [Layer dati e API](#layer-dati-e-api)
- [Classificazione del rischio](#classificazione-del-rischio)
- [Tema e dark mode](#tema-e-dark-mode)
- [Export PDF](#export-pdf)
- [Notifiche](#notifiche)
- [Avvio del progetto](#avvio-del-progetto)

---

## Stack tecnologico

| Categoria | Tecnologia |
|---|---|
| Framework UI | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| Stili | Tailwind CSS v4 |
| Componenti | shadcn/ui + Radix UI |
| Grafici | Recharts 3 |
| State management | Zustand (con persistenza) |
| Server state | TanStack React Query v5 |
| Form / Validazione | React Hook Form + Zod |
| Icone | Lucide React + Remix Icons |
| Date | date-fns |
| Toast | Sonner |
| Export PDF | react-to-print |
| Markdown | react-markdown |
| Backend | Node.js, Hono, Drizzle ORM |
| Database | PostgreSQL (Neon serverless) |
| Deploy | Vercel (frontend + backend) |

---

## Struttura del progetto

```
data-analyzer_frontend/
└── src/
    ├── pages/                  # Pagine dell'applicazione
    │   ├── dashboard-page.tsx
    │   ├── report-page.tsx
    │   ├── compare-page.tsx
    │   ├── login-page.tsx
    │   └── not-found-page.tsx
    ├── components/
    │   ├── ui/                 # Primitivi shadcn (Button, Card, Input, …)
    │   ├── shell/              # App shell, header, breadcrumb, upload, skeleton
    │   ├── report/             # Componenti specifici del report
    │   └── dashboard/          # Componenti specifici della dashboard
    ├── layout/                 # AppLayout (wrapper con header e contenuto)
    ├── hooks/                  # Hook personalizzati (useReports, useT, useMobile)
    ├── lib/                    # Utility: api.ts, i18n.ts, risk-utils.ts, mock-data.ts
    ├── types/                  # Interfacce TypeScript (report.ts, user.ts)
    ├── features/               # Zustand stores (auth, lang, notifications, dashboard)
    └── main.tsx                # Router, providers, configurazione QueryClient

data-analyzer_backend/
└── src/
    ├── db/                     # Schema Drizzle, migrazioni, seed
    └── routes/                 # summaries.route.ts
```

### Routing

```
/login                 → LoginPage
/ (protetto)
  → AppLayout
    ├── /              → DashboardPage
    ├── /report/:id    → ReportPage  (+ ?scan=scanId per snapshot storici)
    ├── /compare/:domain → ComparePage  (+ ?a=scanId&b=scanId)
    └── *              → NotFoundPage
```

---

## Autenticazione

La pagina `/login` gestisce l'accesso con email e password.

- **Validazione**: schema Zod con errori inline sotto i campi
- **Stato di caricamento**: bottone disabilitato con spinner durante la richiesta
- **Token JWT**: salvato nello store Zustand con persistenza su `localStorage`
- **Route protette**: il componente `ProtectedRoute` intercetta tutte le rotte non pubbliche e redirige a `/login` se il token è assente
- **Logout**: cancella token e utente dallo store e reindirizza a `/login`

---

## Dashboard

La pagina principale (`/`) è il punto di controllo centrale dell'intera flotta di domini monitorati.

### Schede statistiche

Quattro card mostrano metriche aggregate su tutti i domini:

| Card | Descrizione |
|---|---|
| **Domini analizzati** | Numero totale di domini con almeno una scansione completata |
| **Risk score medio** | Media dei risk score globali di tutti i domini |
| **Alto rischio** | Conteggio domini classificati come "Alto" |
| **Critici** | Conteggio domini classificati come "Critico" |

### Grafico trend (30 giorni)

Un'area chart mostra l'andamento del risk score globale medio nel tempo. Il riempimento usa un gradiente colorato che va dal verde (basso rischio) al rosso (critico). Il tooltip interattivo mostra il valore esatto per ogni data.

### Top domini con variazione

Pannello a scheda unica diviso in due colonne:

- **Top 10 peggiorati**: domini con il maggiore incremento del risk score tra l'ultima e la penultima scansione, ordinati per delta decrescente
- **Top 10 migliorati**: domini con la maggiore riduzione, ordinati per delta crescente

Per ogni riga viene mostrato il nome del dominio, il delta numerico e una freccia direzionale colorata. Il pannello mostra uno spinner di caricamento durante il fetch dei dati e un messaggio informativo se non esistono ancora abbastanza scansioni storiche.

### Tabella domini monitorati

Tabella completa, interattiva e paginata di tutti i domini.

#### Ricerca

Campo di testo per filtrare i domini per nome (client-side, real-time, case-insensitive).

#### Filtro per livello di rischio

Popover con checkbox multipli per selezionare uno o più livelli:
- Critico / Alto / Medio / Basso
- Badge sull'icona filtro con il conteggio delle opzioni attive
- Bottone "Rimuovi tutti i filtri" per reset rapido

#### Filtro per data

Date picker (Calendar shadcn) per visualizzare i domini scansionati in una data specifica. Quando attivo:
- Viene effettuata una chiamata API separata (`useReportsByDate`) senza deduplicazione
- Mostra tutti i report registrati in quella data
- Il filtro è persistito in `sessionStorage` (rimane al refresh della scheda ma non tra sessioni diverse)

#### Colonne e ordinamento

Ogni intestazione di colonna è cliccabile per ordinare i risultati. Click successivi alternano direzione ascendente/discendente. L'icona di ordinamento (`↕ / ↑ / ↓`) indica la colonna e la direzione attive.

| Colonna | Contenuto |
|---|---|
| Dominio | Nome del dominio con eventuale badge di stato (pending / error) |
| Risk Score | Valore numerico + badge colorato (Basso / Medio / Alto / Critico) |
| Asset | Numero di asset infrastrutturali rilevati |
| Vulnerabilità | Conteggio totale vulnerabilità attive e passive |
| Data Leak | Numero di record esfiltrati rilevati |
| WAF | Icona check (rilevato) o trattino (non rilevato) |
| Data | Data dell'ultima scansione, localizzata (IT/EN) |
| Azioni | Icone: confronta, elimina |

#### Stato delle scansioni per riga

- Badge giallo animato per scansioni ancora in elaborazione (`status: "pending"`)
- Badge rosso per scansioni fallite (`status: "error"`)
- Nessun badge per scansioni completate con successo

#### Azioni per riga

- **Confronta** (icona GitCompare): naviga a `/compare/:domain`
- **Elimina** (icona Trash): apre un dialog di conferma con il nome del dominio. In caso di successo mostra un toast verde e rimuove la riga; in caso di errore mostra un toast rosso con il messaggio

#### Paginazione

- 10 domini per pagina (costante `PER_PAGE` fuori dal componente)
- Bottoni "← Prec" / "Succ →"
- Indicatore testo: "N domini · pagina X di Y"

#### Persistenza dello stato nell'URL

I parametri search dell'URL vengono aggiornati in sincronia con i filtri:

| Parametro | Valore |
|---|---|
| `q` | Testo di ricerca |
| `p` | Pagina corrente |
| `risk` | Livelli di rischio selezionati (ripetuto) |
| `sort` | Colonna di ordinamento |
| `dir` | Direzione (`asc` / `desc`) |

Questo permette di ricaricare la pagina o condividere l'URL mantenendo esattamente lo stesso stato della tabella.

### Upload report

Il bottone upload nell'header apre un dialog per caricare un file JSON con i dati di una nuova scansione (singola o multipla). Dopo l'upload:
- La cache React Query viene invalidata → la dashboard si aggiorna automaticamente
- Appare una notifica nella campanella per ogni dominio caricato
- Il report è persistito sul database Neon tramite POST al backend

---

## Pagina Report

La pagina `/report/:id` mostra l'analisi completa di sicurezza per un singolo dominio.

### Breadcrumb e navigazione storica

- Breadcrumb cliccabile: Dashboard → nome dominio
- Dropdown per selezionare qualsiasi scansione storica del dominio (ordinata dalla più recente)
- I parametri `?scan=scanId` nell'URL permettono di condividere o riaprire un snapshot specifico

### Banner snapshot storico

Quando si visualizza una scansione passata (non la più recente), appare un banner informativo con:
- Data dello snapshot visualizzato
- Link rapido "Vai all'ultimo →" per tornare alla versione corrente

### Risk Gauge

Indicatore semicircolare SVG con:
- Arco colorato proporzionale al risk score (0–100)
- Colore dinamico in base alla soglia (verde / giallo / arancione / rosso)
- Valore numerico al centro
- Etichetta testuale del livello di rischio sotto

### Sezione Sommario

Testo di sintesi della scansione, renderizzato come Markdown. Cambia lingua automaticamente con il toggle IT/EN dell'header (utilizza i campi `summary_text` per italiano e `summary_text_en` per inglese).

### 9 Score Card

Card individuali per ogni dimensione di rischio, ciascuna con:
- Numero del punteggio colorato (in base al livello)
- Badge con etichetta testuale del rischio
- Barra di progresso colorata proporzionale al punteggio (0–100)

| Score | Cosa misura |
|---|---|
| Servizi Esposti | Porte e servizi accessibili dall'esterno |
| Data Leak | Dati esfiltrati rilevati |
| Email Leak | Indirizzi email esposti in breach |
| Email Spoofing | Vulnerabilità di impersonazione email |
| Porte Aperte | Numero e criticità delle porte esposte |
| Blacklist | Presenza in blacklist IP/dominio |
| Vuln. Attive | Vulnerabilità sfruttabili attivamente |
| Vuln. Passive | Vulnerabilità rilevate passivamente |
| Certificati SSL | Validità e configurazione dei certificati |

### Grafici tecnici

- **Porte aperte**: grafico a barre orizzontale con porta, protocollo e nome servizio
- **Vulnerabilità**: distribuzione per severità e tipo (attive vs passive) in un grafico a barre raggruppate
- **Data leak**: categorie dei dati esfiltrati con stato risolto/irrisolto

### Card dettagli tecnici

**Email Security**
Tre righe di stato con icona e badge colorato:
- **Spoofing**: "Possibile" (rosso) / "Protetto" (verde)
- **DMARC**: protezione massima / parziale / nessuna
- **Blacklist**: conteggio rilevamenti con lista espandibile delle blacklist che includono il dominio

**Rete & Asset**
Griglia di metriche dell'infrastruttura rilevata:
- Asset totali, IPv4 unici, IPv6 unici
- Domini simili rilevati
- Certificati SSL attivi e scaduti

**WAF & CDN**
Per ciascun servizio (WAF e CDN):
- Badge verde con conteggio se rilevato, badge grigio "Non rilevato" se assente
- Lista numerata degli asset protetti (URL/IP)

### Azioni

- **Esporta PDF**: attiva la stampa del report via `react-to-print` con layout ottimizzato (nasconde header e bottoni, aggiunge page break tra sezioni)
- **Confronta**: naviga a `/compare/:domain`; disabilitato con tooltip esplicativo se il dominio ha meno di 2 scansioni

---

## Pagina Confronto

La pagina `/compare/:domain` mette a confronto due scansioni storiche dello stesso dominio.

### Selezione scansioni

Due dropdown (A = Attuale, B = Precedente) permettono di scegliere liberamente qualsiasi coppia di scansioni tra quelle disponibili. I parametri `?a=scanId&b=scanId` nell'URL rendono il confronto condivisibile e riapribile.

### Stato di caricamento

Quando i dati sono in fetch, viene mostrato un spinner centrato con testo "Caricamento dati…" al posto dei contenuti.

### Hero del risk score

Due card affiancate mostrano il risk score di ciascuna scansione:
- Punteggio numerico in grande con colore del livello di rischio
- Tag identificativo "A — Attuale" / "B — Precedente"
- Delta calcolato con freccia e colore (verde se migliorato, rosso se peggiorato, grigio se invariato)

### Radar chart

Grafico radar a 9 assi (uno per ogni dimensione di rischio) con entrambe le scansioni sovrapposte. Permette di vedere a colpo d'occhio dove A e B differiscono di più. Utilizza Recharts `RadarChart` con colori e aree distinte per A e B.

### Tabella Email Security

Confronto riga per riga dei parametri email:
- Spoofing, DMARC policy, Blacklist (con dettaglio delle liste)
- Delta badge per ogni metrica (migliorato / peggiorato / invariato / risolto)

### Grafico vulnerabilità

Bar chart grouped che confronta la distribuzione delle vulnerabilità (per severità: critica, alta, media) tra le due scansioni, sia per la componente attiva che passiva.

### Metriche chiave

Otto card comparative per le metriche principali, ciascuna con valore A, valore B e freccia di tendenza colorata:

| Metrica | Descrizione |
|---|---|
| Vulnerabilità Totali | Somma di tutte le vulnerabilità rilevate |
| Data Leak Totali | Totale record esfiltrati |
| Potential Stealer | Credenziali a rischio stealer |
| Certificati Scaduti | SSL scaduti o non validi |
| Certificati Attivi | SSL validi |
| Asset | Asset infrastrutturali rilevati |
| IPv4 Univoci | Indirizzi IP univoci rilevati |
| Blacklist | Numero di rilevamenti in blacklist |

---

## Pagina 404

Route catch-all (`*`) con pagina di errore per percorsi non riconosciuti:
- Icona `SearchX` in un cerchio neutro
- Titolo "404" in grande
- Messaggio localizzato (IT/EN)
- Bottone "Torna alla dashboard" che usa `useNavigate` per tornare a `/`

---

## Visualizzazioni e grafici

Tutti i grafici usano **Recharts 3** con `ResponsiveContainer` per adattarsi al layout. I tooltip sono personalizzati per mostrare il valore esatto al hover.

| Grafico | Tipo | Pagina |
|---|---|---|
| Risk trend 30 giorni | AreaChart con gradiente colorato | Dashboard |
| Porte aperte | BarChart orizzontale | Report |
| Distribuzione vulnerabilità | BarChart grouped | Report + Confronto |
| Data leak categorie | BarChart stacked | Report |
| Risk score radar | RadarChart 9 assi | Confronto |
| Risk gauge | SVG custom semicircolare | Report |

**RiskGauge** è un componente SVG custom (non Recharts) che disegna manualmente un arco semicircolare, calcola la coordinata del punto finale tramite trigonometria e applica un colore dinamico in base al punteggio.

---

## Internazionalizzazione

L'intera UI è bilingue **Italiano / Inglese** con un sistema i18n custom, senza dipendenze esterne.

### Come funziona

1. `src/lib/i18n.ts` definisce due oggetti (`it`, `en`) con tutte le stringhe, strutturati per sezione
2. L'hook `useT()` legge la lingua corrente dallo store Zustand e restituisce l'oggetto traduzione corretto con tipizzazione completa
3. Il toggle IT/EN nell'header aggiorna la lingua in real-time in tutta l'app
4. La preferenza viene salvata in `localStorage` tramite Zustand

### Sezioni di traduzione

| Chiave | Contenuto |
|---|---|
| `risk` | Livelli di rischio (Basso, Medio, Alto, Critico) |
| `nav` | Navigazione e breadcrumb |
| `header` | Header (tema, notifiche, logout, timestamp relativi) |
| `dash` | Dashboard (statistiche, colonne tabella, filtri, paginazione, messaggi) |
| `notFound` | Pagina 404 |
| `report` | Pagina report (sezioni, score label, azioni, banner storico) |
| `cmp` | Pagina confronto (radar, metriche, tabella email) |
| `emailSec` | Card sicurezza email |
| `network` | Card rete e asset |
| `wafCdn` | Card WAF e CDN |
| `trend` | Grafico trend risk score |

Le chiavi con interpolazione sono funzioni tipizzate, ad esempio:

```ts
pageInfo: (cur: number, tot: number, count: number) =>
  `${count} domini · pagina ${cur} di ${tot}`

deleteConfirm: (domain: string) =>
  `Eliminare l'analisi di ${domain}?`
```

---

## Gestione dello stato

### Zustand stores

| Store | Persistenza | Contenuto |
|---|---|---|
| `AuthStore` | `localStorage` | Utente corrente, token JWT, `login()`, `logout()` |
| `LangStore` | `localStorage` | Lingua attiva (`it`/`en`), `toggle()`, `setLang()` |
| `NotificationsStore` | In-memory | Lista notifiche, `add()`, `markAllRead()`, `clear()` |
| `DashboardFiltersStore` | `sessionStorage` | Filtro data attivo, `setDateFilter()`, `clearDateFilter()` |

### TanStack React Query v5

Gestisce tutto lo stato server (report, scansioni) con cache automatica e invalidazione:

| Hook | Descrizione |
|---|---|
| `useReports()` | Ultimi report, deduplicati per dominio (`latest=true`) |
| `useReportsByDate(date)` | Tutti i report per una data specifica (no cache) |
| `useAllReports()` | Tutti i report di tutte le scansioni |
| `useReport(domain, scanId?)` | Report singolo (risolve domain → id dalla cache) |
| `useReportHistory(domain)` | Tutte le scansioni storiche di un dominio |
| `useDeleteReport()` | Mutation delete con invalidazione cache automatica |

Configurazione globale: 30s stale time, 1 retry, no refetch on window focus.

---

## Layer dati e API

`src/lib/api.ts` gestisce tutte le chiamate HTTP al backend.

### Modalità mock

Quando `VITE_API_BASE_URL` non è impostata, l'app gira in **mock mode** usando dati locali da `src/lib/mock-data.ts` — nessun backend necessario, utile per sviluppo frontend standalone.

### Autenticazione API

Ogni richiesta include l'header `Authorization: Bearer <token>` letto dallo store Zustand.

### Endpoint

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/summaries?latest=true` | Ultima scansione per dominio |
| `GET` | `/api/summaries?latest=false` | Tutte le scansioni |
| `GET` | `/api/summaries?date=YYYY-MM-DD` | Report per data specifica |
| `GET` | `/api/summaries/:id` | Report singolo per ID o nome dominio |
| `GET` | `/api/summaries/history/:domain` | Tutte le scansioni di un dominio |
| `POST` | `/api/summaries` | Carica una o più scansioni JSON |
| `DELETE` | `/api/summaries/:id` | Elimina un report |
| `POST` | `/api/summaries/seed` | Popola il database con dati demo |

---

## Classificazione del rischio

`src/lib/risk-utils.ts` centralizza la logica di classificazione e coloring per tutti i componenti.

| Soglia | Livello | Colore testo | Colore badge | Colore barra |
|---|---|---|---|---|
| 0–24 | Basso | Verde | Verde chiaro | Verde |
| 25–49 | Medio | Giallo | Giallo chiaro | Giallo |
| 50–74 | Alto | Arancione | Arancione chiaro | Arancione |
| 75–100 | Critico | Rosso | Rosso chiaro | Rosso |

Ogni livello espone: `textClass`, `badgeClass`, `bgClass`, `label` (IT e EN).

---

## Tema e dark mode

- `ThemeProvider` wrappa l'intera app
- Toggle sole/luna nell'header con label localizzata
- La preferenza viene salvata in `localStorage`
- Tutti i componenti usano le variabili semantiche Tailwind (`bg-background`, `text-foreground`, `text-muted-foreground`, `border`, ecc.) per adattarsi automaticamente
- I grafici Recharts leggono variabili CSS per colori e stroke in entrambi i temi

---

## Export PDF

Il bottone "Esporta PDF" nella pagina report usa `react-to-print`:

- Stampa l'intero contenuto del report con layout ottimizzato
- `print:hidden` nasconde header, bottoni, dropdown e controlli UI
- `print:break-inside-avoid` previene tagli di pagina all'interno delle card
- I margini di pagina sono definiti via `@page` in `index.css`

---

## Notifiche

La campanella nell'header gestisce le notifiche in-app:

- **Badge rosso** con conteggio delle notifiche non lette
- Dropdown con lista di notifiche: nome dominio e timestamp relativo (adesso / N min fa / N ore fa / N giorni fa)
- **Generazione automatica**: una notifica viene creata per ogni dominio caricato con successo via upload
- Click su una notifica naviga direttamente al report del dominio relativo
- Bottone "Cancella tutto" per svuotare la lista e azzerare il badge

---

## Avvio del progetto

```bash
# Frontend
cd data-analyzer_frontend
npm install
npm run dev

# Backend
cd data-analyzer_backend
npm install
npm run dev

# Type check (frontend)
npx tsc --noEmit
```

### Variabili d'ambiente

```env
# Frontend (.env)
VITE_API_BASE_URL=https://your-backend.vercel.app

# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
```

Se `VITE_API_BASE_URL` non è impostata, il frontend gira in **mock mode** con dati locali — nessun backend necessario.
