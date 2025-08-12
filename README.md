
run:
  docker compose up --build
or:
  cd backend && npm install && npm run dev
  cd ../frontend && echo "VITE_BACKEND_URL=http://localhost:8080" > .env.local && npm install && npm run dev
