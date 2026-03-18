# Deploy to VM (subdomain solana-ohlc-candlestick-data-api)

## 1. Upload project (from your Mac)

From the project root:

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

This rsyncs to `root@65.109.218.200:/root/solana-ohlc-candlestick-data-api/` (excluding `node_modules`, `dist`, `.env`, `data`). Set `SSH_PASS` in the environment to override the script default.

## 2. First-time setup on the VM

SSH in, then:

```bash
cd /root/solana-ohlc-candlestick-data-api
nvm use
npm ci
cp .env.example .env
# Edit .env and set VYBE_API_KEY=your_key
npm run build
npm run build:frontend
```

Install and enable the systemd service:

```bash
sudo cp deploy/solana-ohlc-candlestick-data-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable solana-ohlc-candlestick-data-api
sudo systemctl start solana-ohlc-candlestick-data-api
```

Check status: `sudo systemctl status solana-ohlc-candlestick-data-api`

## 3. After later deploys (upload + rebuild + restart)

From your Mac:

```bash
./deploy/deploy.sh
```

Then on the VM:

```bash
cd /root/solana-ohlc-candlestick-data-api
npm ci
npm run build
npm run build:frontend
sudo systemctl restart solana-ohlc-candlestick-data-api
```

## 4. Reverse proxy

Subdomain for this app is already assigned like the historical-trade-data-api. Point it at `http://127.0.0.1:3000` (or the `PORT` you set in `.env`).

## One-off run (no service)

```bash
cd /root/solana-ohlc-candlestick-data-api
npm ci && npm run build && npm run build:frontend && node dist/server.js
```
