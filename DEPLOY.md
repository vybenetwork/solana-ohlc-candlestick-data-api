# Deploy to VM (e.g. Cloudflare DNS → instance)

1. **SSH into your VM.**

2. **Clone or pull the repo** (use your branch; adjust path if needed):
   ```bash
   git clone https://github.com/vybenetwork/solana-historical-trade-data-api.git
   cd solana-historical-trade-data-api
   git checkout feat/ts-base-trades-ui
   ```
   If the repo already exists:
   ```bash
   cd solana-historical-trade-data-api
   git fetch origin && git checkout feat/ts-base-trades-ui && git pull origin feat/ts-base-trades-ui
   ```

3. **Install Node (if needed).** The project has `.nvmrc`; with nvm:
   ```bash
   nvm use
   npm ci
   ```

4. **Environment.** Copy the example env and set your API key:
   ```bash
   cp .env.example .env
   # Edit .env and set VYBE_API_KEY=your_key
   ```

5. **Build backend and frontend:**
   ```bash
   npm run build
   npm run build:frontend
   ```

6. **Run the server.** Port 3000 by default; set `PORT` in `.env` if you use something else (e.g. 80 behind a reverse proxy):
   ```bash
   node dist/server.js
   ```
   Or with PM2 for a long-running process:
   ```bash
   npx pm2 start dist/server.js --name historical-trades
   ```

7. **Optional: reverse proxy.** If you use Nginx/Caddy in front of the app, proxy `https://solana-historical-trade-data-api.dehghani.ca` to `http://127.0.0.1:3000`.

**Quick one-off run (after clone + env):**
```bash
npm ci && npm run build && npm run build:frontend && node dist/server.js
```