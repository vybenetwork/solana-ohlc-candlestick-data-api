/**
 * Debug script: fetch trades from the API, save raw response, then log the exact
 * values used to build candles so we can see why prices might be wrong.
 *
 * Run: npm run debug:trades
 * Or:  npx tsx scripts/debug-trades-candles.ts [mintAddress]
 *
 * Writes:
 *   debug-trades-response.json  - raw API response
 *   debug-candles-debug.json    - per-trade fields we use + resulting candles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, getApiKey } from '../src/config.js';
import { createClient } from '../src/api/index.js';
import type { VybeTrade } from '../src/types/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const OUT_RESPONSE = path.join(projectRoot, 'debug-trades-response.json');
const OUT_DEBUG = path.join(projectRoot, 'debug-candles-debug.json');

/** USD-stable quote mints used for candle price (same as frontend). */
const CANDLE_QUOTE_MINTS = new Set<string>([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD
]);

function resolutionToSeconds(resolution: string): number {
  switch (resolution) {
    case '1m':
      return 60;
    case '5m':
      return 5 * 60;
    case '15m':
      return 15 * 60;
    case '1h':
      return 60 * 60;
    case '4h':
      return 4 * 60 * 60;
    case '1d':
      return 24 * 60 * 60;
    default:
      return 60 * 60;
  }
}

function buildCandlesFromTrades(
  trades: VybeTrade[],
  resolution: string,
  analysedMint: string
): { candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>; tradeLog: Array<Record<string, unknown>> } {
  const mint = analysedMint.trim();
  const bucketSize = resolutionToSeconds(resolution);
  const byBucket = new Map<
    number,
    { open: number; high: number; low: number; close: number; volume: number }
  >();
  const sorted = [...trades]
    .filter((t) => {
      if (typeof t.blockTime !== 'number' || t.price == null) return false;
      const base = (t.baseMintAddress ?? '').trim();
      const quote = (t.quoteMintAddress ?? '').trim();
      return (base === mint && CANDLE_QUOTE_MINTS.has(quote)) || (quote === mint && CANDLE_QUOTE_MINTS.has(base));
    })
    .sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0));

  const tradeLog: Array<Record<string, unknown>> = [];

  for (const t of sorted) {
    const bt = t.blockTime!;
    const base = (t.baseMintAddress ?? '').trim();
    const priceRaw = t.price;
    const rawPrice = Number(priceRaw);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue;
    const price = base === mint ? rawPrice : 1 / rawPrice;
    const bucket = Math.floor(bt / bucketSize) * bucketSize;
    const quoteSizeRaw = t.quoteSize;
    const quoteSize = Number(quoteSizeRaw);
    const vol = Number.isFinite(quoteSize) ? quoteSize : 0;

    tradeLog.push({
      blockTime: bt,
      priceRaw,
      priceParsed: rawPrice,
      priceNormalized: price,
      quoteSizeParsed: quoteSize,
      bucket,
      baseMintAddress: t.baseMintAddress,
      quoteMintAddress: t.quoteMintAddress,
    });

    const existing = byBucket.get(bucket);
    if (!existing) {
      byBucket.set(bucket, {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: vol,
      });
    } else {
      existing.close = price;
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.volume += vol;
    }
  }

  const candles = [...byBucket.entries()]
    .map(([time, v]) => ({
      time,
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close,
      volume: v.volume,
    }))
    .sort((a, b) => a.time - b.time);

  return { candles, tradeLog };
}

async function main(): Promise<void> {
  const mint = process.argv[2]?.trim() || 'So11111111111111111111111111111111111111112';

  loadEnv();
  const apiKey = getApiKey();
  const client = createClient(apiKey);

  console.log('Fetching trades for mint:', mint);
  const data = await client.getTrades({
    mintAddress: mint,
    limit: 200,
    sortByDesc: 'blockTime',
  });

  const raw = data as { data?: VybeTrade[]; [k: string]: unknown };
  const trades = Array.isArray(raw.data) ? raw.data : [];

  fs.writeFileSync(OUT_RESPONSE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Saved raw response to', OUT_RESPONSE);
  console.log('Trade count:', trades.length);

  if (trades.length > 0) {
    const first = trades[0];
    console.log('\nFirst trade (raw) keys:', Object.keys(first));
    console.log(
      'First trade sample:',
      JSON.stringify(
        {
          blockTime: first.blockTime,
          price: first.price,
          quoteSize: first.quoteSize,
          baseSize: first.baseSize,
          baseMintAddress: first.baseMintAddress,
          quoteMintAddress: first.quoteMintAddress,
        },
        null,
        2
      )
    );
  }

  const resolution = '1m';
  const { candles, tradeLog } = buildCandlesFromTrades(trades, resolution, mint);

  const debugOut = {
    resolution,
    bucketSizeSeconds: resolutionToSeconds(resolution),
    tradeCount: trades.length,
    tradeLogFirst10: tradeLog.slice(0, 10),
    tradeLogLast5: tradeLog.slice(-5),
    candlesCount: candles.length,
    candlesFirst5: candles.slice(0, 5),
    candlesLast5: candles.slice(-5),
    fullTradeLog: tradeLog,
    fullCandles: candles,
  };

  fs.writeFileSync(OUT_DEBUG, JSON.stringify(debugOut, null, 2), 'utf-8');
  console.log('\nSaved candle debug to', OUT_DEBUG);
  console.log('Candles built:', candles.length);
  if (candles.length > 0) {
    console.log('First candle:', candles[0]);
    console.log('Last candle:', candles[candles.length - 1]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
