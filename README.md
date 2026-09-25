# CropSure AI

CropSure AI is a crop-loss reporting prototype. Farmers submit damage reports with evidence and location; officers review those reports, save a decision, and add a visible note.

## Prerequisites

- Node.js 20 or newer
- A MongoDB database (Atlas or local)

## Run locally

1. In `server`, copy `.env.example` to `.env`, then provide a MongoDB connection string and a long random `JWT_SECRET`. Set `CLIENT_ORIGIN` to the URL Vite prints when it starts (normally `http://localhost:5173`).
2. Install dependencies with `npm install` in both `server` and `client`.
3. Set `OFFICER_NAME`, `OFFICER_ID`, and `OFFICER_PASSWORD` in `server/.env`. The server creates or updates this officer automatically each time it starts. For example, `OFFICER_ID=officer-001` and `OFFICER_PASSWORD=your-strong-password` become the login values.

4. For Gemini, create an API key at https://aistudio.google.com/apikey and set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` in `server/.env`. `GEMINI_MODEL` selects the primary model; optional `GEMINI_FALLBACK_MODEL` is tried if its quota is exhausted or it is temporarily busy. Gemini quotas apply per model and project. OpenAI can be selected with `AI_PROVIDER=openai` and `AI_API_KEY` instead.

5. Start the API with `npm run dev` from `server`.
6. In a second terminal, copy `client/.env.example` to `client/.env`, then start the web app with `npm run dev` from `client`.

The frontend defaults to `http://localhost:4000/api`; set `VITE_API_URL` for another API host.

## Quality checks

```powershell
cd client
npm run lint
npm run build
```

## Workflow

1. Register as a farmer.
2. Submit a report with crop type, estimated damage, description, location, and optional image evidence.
3. Sign in as an officer and set the status or a note.
4. The farmer sees the current status and officer note on Track Status.
