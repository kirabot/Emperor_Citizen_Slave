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

License: see repository for details.
