# Fister-Festivalen

Moderne festivalnettside bygget med Next.js, Tailwind CSS og Firebase.

## Innhold

- Sommerlig hero-seksjon med CTA og smooth scroll
- Live paamelding med dynamiske navnefelt
- Realtime deltakerliste og automatisk totalantall
- Vaerkort for Fister via OpenWeather
- Bildeopplasting til Firebase Storage og galleri i grid-layout
- Responsivt design for mobil, nettbrett og desktop
- Countdown til festivaldato
- Toast-beskjeder og enkel feilhaandtering

## Teknisk stack

- Frontend: Next.js 16 + React 19 + Tailwind CSS 4
- Database: Firebase Firestore
- Fil-lagring: Firebase Storage
- Vaerdata: OpenWeather API
- Hosting: Vercel anbefales, Netlify fungerer ogsaa

## Lokal oppstart

1. Installer avhengigheter:

```bash
npm install
```

2. Lag en lokal miljo-fil:

```bash
cp .env.example .env.local
```

3. Fyll inn verdiene i `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FESTIVAL_DATE=2026-07-18T12:00:00+02:00
OPENWEATHER_API_KEY=your-openweather-api-key
```

4. Start utviklingsserveren:

```bash
npm run dev
```

5. Aapne [http://localhost:3000](http://localhost:3000)

## Firebase-oppsett

Opprett et Firebase-prosjekt og aktiver:

- Firestore Database
- Firebase Storage

Bruk regelsettene i prosjektet:

- `firebase/firestore.rules`
- `firebase/storage.rules`

Opprett to Firestore-collections:

- `participants`
- `gallery`

Dokumentene opprettes automatisk fra appen nar brukere sender inn navn eller laster opp bilder.

## OpenWeather-oppsett

1. Opprett en konto hos [OpenWeather](https://openweathermap.org/api)
2. Lag en API-nokkel
3. Legg den inn som `OPENWEATHER_API_KEY`

Vaerdata hentes via `src/app/api/weather/route.ts`, slik at API-nokkelen blir liggende serverside.

## Deploy

### Vercel

1. Push repoet til GitHub
2. Importer prosjektet i [Vercel](https://vercel.com/)
3. Legg inn miljoverdiene fra `.env.local`
4. Deploy

### Netlify

1. Opprett et nytt prosjekt fra repoet i [Netlify](https://www.netlify.com/)
2. Velg framework preset for `Next.js` hvis Netlify foreslaar det
3. Repoet inneholder `netlify.toml` med:
   - build command `npm run build`
   - publish directory `.next`
   - Node `20`
   - `@netlify/plugin-nextjs`
4. Legg inn de samme miljoverdiene
5. Deploy eller bruk `Clear cache and deploy site`

Viktig:

- Ikke deploy repo-roten som en statisk side.
- Hvis sitet tidligere ble satt opp som en enkel statisk side, maa gamle Site settings ryddes eller sitet opprettes pa nytt fra repoet.
- Hvis du ser 404 eller en gammel enkel HTML-side, kjor `Clear cache and deploy site` etter at siste commit er hentet inn.

For best opplevelse med Next.js er Vercel det enkleste valget.

## Prosjektstruktur

```text
src/
  app/
    api/weather/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    countdown-card.tsx
    festival-app.tsx
    gallery-section.tsx
    participant-list.tsx
    signup-form.tsx
    toast-region.tsx
    weather-card.tsx
  lib/
    firebase.ts
    types.ts
    utils.ts
firebase/
  firestore.rules
  storage.rules
```

## Viktige notater

- Appen fungerer uten ferdige API-nokler, men viser da tydelige oppsettsmeldinger i UI.
- Paamelding og galleri bruker realtime listeners fra Firestore.
- Galleri bruker Firebase Storage for filer og Firestore for metadata.
- `NEXT_PUBLIC_FESTIVAL_DATE` kan byttes uten kodeendring hvis datoen skal flyttes.
