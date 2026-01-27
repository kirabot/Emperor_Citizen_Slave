# Emperor • Citizen • Slave

Tiny 2‑player bluff game. One side plays Emperor + 4 Citizens, the other plays Slave + 4 Citizens. Players reveal one card per hand; certain matchups instantly decide the round. A match is 4 sets × 3 rounds (roles flip each set). Sudden‑death tiebreaker if needed.

## Quick rules

### Decks
- Emperor side: 1 × Emperor, 4 × Citizen  
- Slave side: 1 × Slave, 4 × Citizen

### Hand outcomes
- Emperor vs Slave → Slave side wins the round  
- Emperor vs Citizen → Emperor side wins the round  
- Slave vs Citizen → Emperor side wins the round  
- Citizen vs Citizen → Hand draw; round continues

### Match format
- 4 sets; each set = 3 rounds  
- Roles flip at the start of each set  
- Winner = most rounds won; tie → one sudden‑death round

## Features
- Web UI (React + Vite)  
- Realtime multiplayer via socket.io  
- Guest‑only rooms (no accounts)  
- Flavorful battle log lines  
- Card images (instead of text buttons)  
- LAN / ZeroTier friendly (set 2 environment variables and run)

## Tech stack
- Frontend: React 18, Vite, socket.io-client  
- Backend: Node 20, Express, socket.io  
- Static hosting supported; backend is a single server.js

## Running (overview)
- Configure environment variables for network mode (LAN / ZeroTier)  
- Start backend (node server.js) and serve frontend (Vite) or use provided build

## Server + client packaging
This repo now supports a dedicated server machine and multiple standalone clients:

### Backend server (host on its own machine)
1. Configure environment variables (see `backend/server.js` for supported values).  
2. Start the server with `npm --prefix backend run start` or via Docker.  
3. Point clients at the server URL (e.g. `http://euclidean.ddns.net:2456`).

### Web client (unchanged)
Build the web UI with `npm --prefix frontend run build` and host the `frontend/dist` output anywhere.

### Desktop client (Windows `.exe`)
An Electron wrapper packages the web UI into a downloadable Windows app while still using the same backend:

```bash
# from repo root
npm --prefix frontend install
npm --prefix desktop install

# build a Windows installer
npm --prefix desktop run dist:win
```

Set `BACKEND_URL` to point at your hosted server when running the desktop app (the dev script builds the renderer before launching Electron):

```bash
BACKEND_URL="http://euclidean.ddns.net:2456" npm --prefix desktop run dev
```

## CI: build desktop app on push
GitHub Actions is configured to build the Windows installer on pushes to `main`. Artifacts are stored in the workflow run output.

License: see repository for details.
