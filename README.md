# Solana OHLC Candlestick Data API

A **Solana OHLC API** and **candlestick API Solana** demo: retrieve Open, High, Low, Close (**OHLC**) **candlestick data** for any Solana token’s USD price, plus volume and trade count. Data is aggregated from vetted USDC, USDT, PYUSD, and wSOL markets so your **candlestick** charts avoid fake wicks and manipulated pools. This repo includes a **web app (GUI)** to display **OHLC candlestick** charts and market lists in the browser.

## Why This Matters

A **candlestick API Solana** answers: "What did the price do over time?" The **Solana OHLC API** from Vybe returns clean **OHLC candlestick data** from vetted markets only—no junk or wash-traded pools. You get flexible resolution (1m to 1y), volume and trade count per candle, and optional gap handling. Use it for charting, backtesting, alerts, and any **Solana OHLC** or **candlestick**-based analytics. This demo uses two endpoints: token **OHLC** candles (the main **candlestick data** source) and markets/pools so you can see where each token trades (e.g. Raydium, Orca, Pump.fun).

### What You Get

- **OHLC candlestick data** — Open, high, low, close, volume, and trade count per candle; resolutions from 1m to 1y.
- **Vetted markets only** — No junk or wash-traded pools; data aggregated from USDC, USDT, PYUSD, wSOL markets.
- **Markets/pools list** — See which DEX (Raydium, Orca, Pump.fun, etc.) and which pool each token trades on.
- **Web app** — Interactive **candlestick chart** and market browser in the browser.

### How This Helps

Use this demo for **charting**, **backtesting**, **token price** history, or building a **Solana price API** into your app. The **REST API** returns clean **candlestick data** so you can render **price charts** or run analytics without scraping. Get your API key and clone to start.

---

**Get a free Vybe API key** (required to run this demo):

**[Get your free Vybe API key →](https://vybenetwork.com/pricing?utm_source=github&utm_medium=repo&utm_campaign=solana-ohlc-candlestick-data-api)**  
**[Vybe API documentation →](https://docs.vybenetwork.com/docs/fetch-ohlc-candles?utm_source=github&utm_medium=repo&utm_campaign=solana-ohlc-candlestick-data-api)**

---

## How to Run

1. Clone this repository:
```bash
git clone https://github.com/your-org/solana-ohlc-candlestick-data-api.git
cd solana-ohlc-candlestick-data-api
```

2. Install dependencies:
```bash
npm install
```

3. Set your API key:
```bash
cp .env.example .env
# Edit .env and add your VYBE_API_KEY
```

4. Run the demo (CLI):
```bash
npm start
```

5. Run the web app (GUI):
```bash
npm run dev
```
Then open **http://localhost:3000**. The UI shows **OHLC candlestick** charts for a token (select resolution) and a list of markets/pools for a chosen DEX.

## Web App / GUI

The included web app is a **Solana OHLC** and **candlestick** viewer: enter a token mint and view **candlestick** charts (OHLC) with configurable resolution (1m–1d); browse markets/pools for a DEX (e.g. Orca Whirlpool, Raydium) to see where the token trades; and toggle between chart and table views of **candlestick data**. All **OHLC** and **candlestick** data is loaded from the Vybe **Solana OHLC API** and rendered in the browser.

## Solana Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /v4/tokens/{mintAddress}/candles` | OHLC candlestick data for a token (resolution 1m–1y, volume, count) |
| `GET /v4/markets` | List markets/pools for a DEX (programAddress); use for pool-specific candlestick charts |

- [Fetch OHLC Candles](https://docs.vybenetwork.com/docs/fetch-ohlc-candles)
- [Fetch Markets / Pools](https://docs.vybenetwork.com/docs/fetch-markets-pools)

## Code Example

```javascript
const axios = require('axios');

const API = 'https://api.vybenetwork.com';
const headers = { 'X-API-Key': process.env.VYBE_API_KEY };

// 1) Token OHLC candlestick data (aggregated across vetted markets)
async function getOHLCCandles(mintAddress, resolution = '1h', limit = 24) {
  const { data } = await axios.get(
    `${API}/v4/tokens/${mintAddress}/candles`,
    { params: { resolution, limit, eliminateCloseToOpenGaps: true }, headers }
  );
  return data;
}

// 2) Markets/pools for a DEX – use marketId for pool-specific candlestick data
async function getMarkets(programAddress, limit = 20) {
  const { data } = await axios.get(
    `${API}/v4/markets`,
    { params: { programAddress, limit }, headers }
  );
  return data;
}

const solMint = 'So11111111111111111111111111111111111111112';
const orcaWhirlpool = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';

Promise.all([
  getOHLCCandles(solMint, '1h', 24),
  getMarkets(orcaWhirlpool, 10)
]).then(([candles, markets]) => {
  console.log('OHLC candlestick count:', candles.data?.length);
  console.log('Markets sample:', markets.data?.slice(0, 3).map(m => m.marketName));
});
```

## Example Output

```json
{
  "data": [
    {
      "time": 1769454000,
      "open": "124.818453303640276994",
      "high": "125.889046941678518274",
      "low": "122.860020140986908674",
      "close": "124.341895651644702722",
      "volume": "12975664.100103864949191661",
      "volumeUsd": "1613418671.545907039739280571076830566546401242",
      "count": 45071
    }
  ]
}
```

## Need Help?

Reach out to Vybe support:
- **Telegram**: [Vybe Telegram community](https://t.me/vybenetwork)
- **Support ticket**: [Submit a ticket on the Vybe website](https://vybenetwork.com)
