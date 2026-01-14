# ChocoFit Academy 🍫💪

App PWA per la gestione personalizzata degli allenamenti in palestra.

## Funzionalità

### 📋 Configurazione Scheda

- **Crea giorni di allenamento** con nome e emoji personalizzati
- **Aggiungi esercizi** con serie, ripetizioni, peso e tempo di riposo
- **Ripetizioni progressive** - imposta un range (es. 14→17) per esercizi a scalare
- **Drag & drop** per riordinare gli esercizi
- **Modifica/Elimina** giorni ed esercizi

### 🏋️ App Allenamento

- **Navigazione intuitiva** tra i giorni con icone emoji (scroll orizzontale a 2 icone)
- **Timer** con suono e vibrazione al termine
- **Modifica al volo** peso, serie e ripetizioni
- **Dropdown progressivo** per tracciare la ripetizione corrente
- **Bottone Salva** (💾) per sincronizzare le modifiche con la configurazione

### ❤️ Carico Cardiaco (opzionale)

- **Toggle** per attivare/disattivare in Configura Scheda
- **Calcolo automatico** del target settimanale (+10% sulla media precedente)
- **Tracking giornaliero** con formula dinamica:
  - `Target oggi = (Target settimanale - Totale fatto) ÷ Giorni rimasti`
- **Floating button** con target del giorno
- **Reset automatico** ogni lunedì

### 💾 Gestione Dati

- **Export** scheda in formato `.json`
- **Import** scheda da file `.json`
- **Cancella scheda** con conferma
- **Dati locali** - tutto salvato nel browser (IndexedDB), nessun server

### 📱 PWA

- **Installabile** su smartphone come app nativa
- **Funziona offline** dopo la prima installazione
- **Mobile-first** - ottimizzato per schermi touch

## Struttura File

```
chocofit/
├── index.html          # Struttura HTML (4 schermate + modali)
├── style.css           # Stili CSS (mobile-first, glassmorphism)
├── script.js           # Logica JavaScript (IndexedDB, eventi)
├── site.webmanifest    # Configurazione PWA
├── favicon.ico         # Icona browser
├── favicon.svg         # Icona vettoriale
└── img/
    ├── LogoChoco.png       # Logo app
    ├── AppPalestra.jpeg    # Sfondo
    └── icons/              # Icone PWA (192x192, 512x512)
```

## Tecnologie

- **HTML5** - struttura semantica
- **CSS3** - Flexbox, Grid, animazioni, glassmorphism
- **JavaScript ES6+** - async/await, moduli
- **Dexie.js** - wrapper IndexedDB per storage locale
- **PWA** - Service Worker, Web App Manifest

## Installazione

1. Apri l'URL nel browser
2. Su mobile: "Aggiungi a schermata Home"

## Utilizzo

### Prima configurazione

1. Clicca "Crea il tuo allenamento"
2. Aggiungi i giorni (es. Lunedì 🏋️, Mercoledì 💪)
3. Per ogni giorno, aggiungi gli esercizi
4. Clicca "Inizia Allenamento"

### Durante l'allenamento

1. Naviga tra i giorni con le icone in alto
2. Modifica peso/reps al volo
3. Usa il timer per il riposo
4. Clicca 💾 per salvare le modifiche

### Ripetizioni Progressive

1. In Modifica Esercizio, attiva "Ripetizioni progressive"
2. Imposta Reps Min (es. 14) e Reps Max (es. 17)
3. Nell'app vedrai un dropdown con 14, 15, 16, 17
4. Seleziona la ripetizione corrente e salva

### Carico Cardiaco

1. In Configura Scheda, attiva "Carico Cardiaco"
2. Clicca il bottone ❤️ nell'app
3. Inserisci la media della settimana scorsa
4. Il sistema calcola il target (+10%)
5. Ogni giorno inserisci il valore fatto

### Backup

- **Export**: Configura Scheda → icona download → salva `.json`
- **Import**: Configura Scheda → icona upload → seleziona `.json`

## Browser Supportati

- Chrome (consigliato)
- Firefox
- Safari
- Edge

## Licenza

© 2025 ChocoFit Academy - Tutti i diritti riservati

---

Sviluppato da PwR con ❤️ per gli amanti del fitness
