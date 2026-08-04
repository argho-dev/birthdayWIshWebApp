# Birthday Surprise

A personalized birthday surprise web app built for Anuska. Features daily surprise messages, animations (birthday cake, confetti, starfield, fireflies), a music player, and a cinematic birthday finale.

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`artifacts/birthday-surprise/`)
- **Backend**: Express API server (`artifacts/api-server/`)
- **Monorepo**: pnpm workspace

## Running the app

The **Birthday Surprise** artifact starts automatically via the managed workflow:

```
artifacts/birthday-surprise: web
```

To start the API server (if needed):
```
artifacts/api-server: API Server
```

## Structure

```
artifacts/
  birthday-surprise/   # React/Vite frontend
    src/
      pages/           # Entry, DailySurprise, NightSkyHeart
      components/      # AccessGate, BirthdayCake, BirthdayFinale, MusicPlayer, etc.
      lib/             # surprises.ts — messages, date logic, surprise modules
    public/
      photos/          # Anuska's photos
      music/           # Background music tracks
  api-server/          # Express backend
    src/
      routes/          # API routes
      lib/             # Logger and utilities
```

## User preferences

- Keep the existing project structure and stack
