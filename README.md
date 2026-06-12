# Data-Analyzer

Piattaforma di analisi della sicurezza dei domini, costruita con React, TypeScript e un backend Node.js con Drizzle ORM.

---

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router v6 |
| Stato | Zustand (middleware persist) |
| Fetching dati | TanStack Query |
| Stile | Tailwind CSS, shadcn/ui |
| Grafici | Recharts |
| Backend | Node.js, Hono, Drizzle ORM |
| Database | PostgreSQL (Neon serverless) |
| Deploy | Vercel (frontend + backend) |

---

## Funzionalità

### Dashboard
- Tabella di tutti i domini monitorati con colonne: dominio, risk score, asset, vulnerabilità, data leak, WAF, data scansione
- **Ricerca** per nome dominio
- **Filtro** per livello di rischio (Basso / Medio / Alto / Critico)
- **Ordinamento** per qualsiasi colonna (crescente / decrescente)
- **Paginazione** con ellissi per dataset grandi
- Filtri, ordinamento e pagina corrente sopravvivono al refresh della pagina (stato gestito tramite URL con `useSearchParams`)
- Card di riepilogo: totale domini, risk score medio, domini ad alto rischio, domini critici
- Grafico dell'andamento del risk score globale (ultimi 30 giorni), mockup (facile implementare in un futuro con dati reali, analizzati per rischio giornaliero)
- Icona di stato accanto al nome del dominio per scansioni in stato `error` o `pending`

### Pagina report
- Report di sicurezza completo per un singolo dominio
- **Gauge di rischio** — semicerchio SVG con punteggio e label colorati in base al livello di rischio
- **Score card** — 9 punteggi individuali (servizi esposti, data leak, leak email, spoofing, porte aperte, blacklist, vuln. attive, vuln. passive, certificati SSL)
- **Grafici**:
  - Distribuzione delle porte aperte (grafico a barre)
  - Vulnerabilità per gravità e tipo — attive vs passive (grafico a barre)
  - Data leak per categoria — risolti vs irrisolti (grafico a barre impilate)
- **Card sicurezza email** — policy DMARC, esposizione spoofing, rilevamenti blacklist
- **Card rete e asset** — numero di asset, IPv4/IPv6 unici, domini simili, certificati attivi e scaduti
- **Card WAF e CDN** — provider WAF e CDN rilevati con lista numerata completa degli asset protetti
- **Testo di sintesi** — sommario in markdown, cambia lingua con il toggle IT/EN
- **Selettore versione** — dropdown per visualizzare qualsiasi scansione storica del dominio
- **Banner snapshot storico** — mostrato quando si visualizza una scansione passata, con link rapido all'ultima
- **Pulsante confronta** — abilitato solo quando esistono ≥ 2 scansioni per il dominio
- **Esportazione PDF** — layout ottimizzato per la stampa con margini `@page` tramite `react-to-print`

### Pagina confronto
- Confronto fianco a fianco di due scansioni dello stesso dominio
- **Grafico radar** — tutti i 9 punteggi di rischio sovrapposti per entrambe le scansioni
- **Grafico a barre** — confronto della distribuzione delle vulnerabilità
- **Tabella metriche chiave** — indicatori di variazione (migliorato / peggiorato / invariato) per: vuln. totali, data leak, asset, IPv4, certificati, blacklist
- **Confronto sicurezza email** — spoofing, DMARC e blacklist affiancati

### Autenticazione
- Pagina di login con autenticazione JWT, pensata per la sicurezza dato che contiene dati sensibili e non accessibili a tutti
- Route protette — gli utenti non autenticati vengono reindirizzati al login
- Token salvato nello store Zustand persistito, rimosso al logout

### Upload
- Pulsante di upload nel toolbar della dashboard, l'ho messo sapendo che una Chiamata API al sistema che genera il json che mi avete dato sarebbe stata piu' corretta, ma non avendola ho creato un sistema di conversione e upload del json o di json con multipli dominii che permetta anche in caso di urgenze e problematica di caricare a volo delle analisi
- Accetta il formato JSON dei risultati di scansione e lo invia al backend via POST
- Al successo, la lista dei domini si aggiorna e viene creata una notifica
- E viene salvata l'analisi su un Database Neon

### Notifiche
- Icona campanella nell'header con badge del numero di notifiche non lette
- Una notifica viene creata per ogni dominio caricato
- Dropdown con timestamp e nome dominio, clic per navigare al report
- Pulsante per cancellare tutte le notifiche

### Internazionalizzazione (IT / EN)
- Pulsante toggle nell'header per passare l'intera interfaccia da italiano a inglese
- Preferenza di lingua persistita in `localStorage` tramite Zustand
- Tutte le stringhe dell'interfaccia, label, tooltip, leggende dei grafici e messaggi di errore sono tradotti
- Il testo di sintesi del report passa tra `summary_text` (IT) e `summary_text_en` (EN)

### Tema
- Toggle chiaro / scuro nell'header
- Preferenza di sistema rispettata al primo caricamento tramite `next-themes`

---

## API Backend

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/summaries?latest=true` | Ultima scansione per dominio, con conteggio scansioni |
| `GET` | `/api/summaries/:id` | Singolo report per ID o nome dominio |
| `GET` | `/api/summaries/history/:domain` | Tutte le scansioni di un dominio, dalla più recente |
| `POST` | `/api/summaries` | Carica uno o più oggetti JSON di scansione |
| `DELETE` | `/api/summaries/:id` | Elimina un report |
| `POST` | `/api/summaries/seed` | Popola il database con dati demo |

### Modalità mock
Quando `VITE_API_BASE_URL` non è impostato, il frontend funziona interamente con dati mock locali — nessun backend necessario. La modalità mock deduplica per dominio, calcola il conteggio delle scansioni e supporta la ricerca.

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
```

Variabili d'ambiente:

```env
# Frontend (.env)
VITE_API_BASE_URL=https://your-backend.vercel.app

# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
```

---

## Struttura del progetto

```
data-analyzer_frontend/
├── src/
│   ├── components/
│   │   ├── report/        # Gauge, score card, grafici, card di dettaglio
│   │   ├── dashboard/     # Grafico trend risk score
│   │   └── shell/         # Header, sidebar, layout, pulsante upload
│   ├── features/
│   │   ├── auth/          # Store autenticazione (Zustand)
│   │   ├── lang/          # Store lingua (Zustand)
│   │   └── notifications/ # Store notifiche (Zustand)
│   ├── hooks/             # useReports, useT, useReportHistory
│   ├── lib/               # Client API, traduzioni i18n, risk utils
│   ├── pages/             # Dashboard, Report, Confronto, Login
│   └── types/             # Interfacce TypeScript (SecurityReport, ecc.)

data-analyzer_backend/
├── src/
│   ├── db/                # Schema Drizzle, migrazioni, seed
│   └── routes/            # summaries.route.ts
```
