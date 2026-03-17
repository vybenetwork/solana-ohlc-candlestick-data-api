/**
 * Express server: proxies Vybe trade history API and serves the web GUI.
 */

import express, { type Request, type Response } from 'express';
import { loadEnv, getApiKey, PUBLIC_DIR } from './config.js';
import { createClient } from './api/index.js';
import { toHumanReadableError } from './api/client.js';
import type { GetTradesParams, TradesSortField } from './api/trades.js';
import { getTokenSymbol } from './api/token-symbol.js';
import {
  readSymbolCacheFromDisk,
  writeSymbolCacheToDisk,
  readProgramCacheFromDisk,
  writeProgramCacheToDisk,
  readHolderCacheFromDisk,
  writeHolderCacheToDisk,
  HOLDER_CACHE_TTL_MS,
} from './cache.js';

loadEnv();
const apiKey = getApiKey();
console.log('VYBE_API_KEY loaded (length %d)', apiKey.length);

const app = express();
const client = createClient(apiKey);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const PROGRAM_LABEL_CONCURRENCY = 3;

function labelFromProgramResponse(data: { programs?: Array<{ name?: string; label?: string; symbol?: string; labels?: string[] }> }): string | null {
  const list = data?.programs ?? [];
  const p = list[0];
  if (!p) return null;
  return (p.name ?? p.label ?? p.symbol ?? (Array.isArray(p.labels) ? p.labels[0] ?? null : null) ?? null) ?? null;
}

function q(req: Request, key: string): string {
  const v = req.query[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const first = v[0];
    return typeof first === 'string' ? first : '';
  }
  return '';
}

function qNum(req: Request, key: string): number | undefined {
  const raw = q(req, key).trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function qBool(req: Request, key: string): boolean | undefined {
  const raw = q(req, key).trim().toLowerCase();
  if (!raw) return undefined;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return undefined;
}

app.get('/api/tokens/:mint', async (req: Request, res: Response) => {
  try {
    const rawMint = req.params.mint;
    const mint = (Array.isArray(rawMint) ? rawMint[0] : rawMint ?? '').trim();
    if (!mint) return res.status(400).json({ error: 'Mint address required' });
    const token = await client.getToken(mint);
    res.json(token);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/tokens/:mint/candles', async (req: Request, res: Response) => {
  try {
    const rawMint = req.params.mint;
    const mint = (Array.isArray(rawMint) ? rawMint[0] : rawMint ?? '').trim();
    if (!mint) return res.status(400).json({ error: 'Mint address required' });

    const resolution = q(req, 'resolution').trim() || '1m';
    const limit = qNum(req, 'limit') ?? 1000;
    const page = qNum(req, 'page');
    const timeStart = qNum(req, 'timeStart');
    const timeEnd = qNum(req, 'timeEnd');
    const eliminateCloseToOpenGaps = qBool(req, 'eliminateCloseToOpenGaps');

    const data = await client.getCandles(mint, {
      resolution,
      timeStart,
      timeEnd,
      limit,
      page,
      eliminateCloseToOpenGaps,
    });
    res.json(data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/markets/:marketAddress/candles', async (req: Request, res: Response) => {
  try {
    const rawMarket = req.params.marketAddress;
    const marketAddress = (Array.isArray(rawMarket) ? rawMarket[0] : rawMarket ?? '').trim();
    if (!marketAddress) return res.status(400).json({ error: 'Market address required' });

    const resolution = q(req, 'resolution').trim() || '1m';
    const limit = qNum(req, 'limit') ?? 1000;
    const page = qNum(req, 'page');
    const timeStart = qNum(req, 'timeStart');
    const timeEnd = qNum(req, 'timeEnd');
    const eliminateCloseToOpenGaps = qBool(req, 'eliminateCloseToOpenGaps');

    const data = await client.getMarketCandles(marketAddress, {
      resolution,
      timeStart,
      timeEnd,
      limit,
      page,
      eliminateCloseToOpenGaps,
    });
    res.json(data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/token-symbol/:mint', async (req: Request, res: Response) => {
  try {
    const rawMint = req.params.mint;
    const mint = (Array.isArray(rawMint) ? rawMint[0] : rawMint ?? '').trim();
    if (!mint) return res.status(400).json({ error: 'Mint address required' });
    const cache = readSymbolCacheFromDisk();
    if (cache[mint] != null) return res.json({ symbol: cache[mint] });
    let symbol = await getTokenSymbol(mint);
    if (symbol === mint || symbol.trim() === '') {
      try {
        const token = await client.getToken(mint);
        symbol = (token.symbol ?? '').trim() || mint;
      } catch {
        symbol = mint;
      }
    }
    const out = symbol || mint;
    if (symbol !== '' && symbol !== mint) {
      cache[mint] = out;
      writeSymbolCacheToDisk(cache);
    }
    res.json({ symbol: out });
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err), symbol: Array.isArray(req.params.mint) ? req.params.mint[0] : req.params.mint });
  }
});

app.get('/api/tokens/:mint/top-holders', async (req: Request, res: Response) => {
  try {
    const rawMint = req.params.mint;
    const mint = (Array.isArray(rawMint) ? rawMint[0] : rawMint ?? '').trim();
    if (!mint) return res.status(400).json({ error: 'Mint address required' });
    const cache = readHolderCacheFromDisk();
    const now = Date.now();
    const cached = cache[mint];
    if (cached && now - cached.fetchedAt < HOLDER_CACHE_TTL_MS) {
      return res.json({ data: cached.data });
    }
    const limit = Math.min(1000, Math.max(0, qNum(req, 'limit') ?? 1000));
    const page = Math.max(0, Math.trunc(qNum(req, 'page') ?? 0));
    const data = await client.getTopHolders(mint, { page, limit });
    const list = data.data ?? [];
    cache[mint] = { data: list, fetchedAt: now };
    writeHolderCacheToDisk(cache);
    res.json(data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/tokens/:mint/holder-labels', async (req: Request, res: Response) => {
  try {
    const rawMint = req.params.mint;
    const mint = (Array.isArray(rawMint) ? rawMint[0] : rawMint ?? '').trim();
    if (!mint) return res.status(400).json({ error: 'Mint address required' });
    const walletsRaw = q(req, 'wallets').trim();
    const wallets = walletsRaw ? walletsRaw.split(/[\s,]+/).map((w) => w.trim()).filter(Boolean) : [];
    const labels: Record<string, string> = {};
    if (wallets.length === 0) return res.json({ labels });

    const cache = readHolderCacheFromDisk();
    let entry = cache[mint];
    const now = Date.now();
    if (!entry || now - entry.fetchedAt >= HOLDER_CACHE_TTL_MS) {
      const data = await client.getTopHolders(mint, { limit: 1000 });
      const list = data.data ?? [];
      cache[mint] = { data: list, fetchedAt: now };
      writeHolderCacheToDisk(cache);
      entry = cache[mint]!;
    }
    const byAddr = new Map<string, { rank: number; ownerName?: string | null }>();
    for (const h of entry.data) {
      const addr = (h.ownerAddress ?? '').trim();
      if (!addr) continue;
      byAddr.set(addr, { rank: h.rank ?? 0, ownerName: h.ownerName ?? null });
    }
    for (const addr of wallets) {
      if (!addr) continue;
      const h = byAddr.get(addr);
      if (h) {
        const label = (h.ownerName ?? '').trim() || `Top #${h.rank}`;
        labels[addr] = label;
      }
    }
    res.json({ labels });
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    const sortByAsc = q(req, 'sortByAsc').trim() as TradesSortField | '';
    const sortByDesc = q(req, 'sortByDesc').trim() as TradesSortField | '';
    if (sortByAsc && sortByDesc) {
      return res.status(400).json({ error: 'Only one of sortByAsc or sortByDesc can be set.' });
    }

    const limitRaw = qNum(req, 'limit');
    const limit = limitRaw != null ? Math.min(Math.max(0, limitRaw), 1000) : 1000;
    const pageRaw = qNum(req, 'page');
    const page = pageRaw != null ? Math.max(0, Math.trunc(pageRaw)) : undefined;

    const marketAddress = q(req, 'marketAddress').trim();

    const params: GetTradesParams = {
      programAddress: q(req, 'programAddress').trim() || undefined,
      baseMintAddress: q(req, 'baseMintAddress').trim() || undefined,
      quoteMintAddress: q(req, 'quoteMintAddress').trim() || undefined,
      mintAddress: q(req, 'mintAddress').trim() || undefined,
      marketAddress: marketAddress || undefined,
      authorityAddress: q(req, 'authorityAddress').trim() || undefined,
      feePayerAddress: q(req, 'feePayerAddress').trim() || undefined,
      resolution: q(req, 'resolution').trim() || undefined,
      timeStart: qNum(req, 'timeStart'),
      timeEnd: qNum(req, 'timeEnd'),
      page,
      limit,
      sortByAsc: sortByAsc || undefined,
      sortByDesc: sortByDesc || undefined,
    };

    // Per API docs: when marketAddress is provided, baseMintAddress/quoteMintAddress are ignored.
    if (params.marketAddress) {
      delete params.baseMintAddress;
      delete params.quoteMintAddress;
    }

    const data = await client.getTrades(params);
    res.json(data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/programs/labeled-program-account', async (req: Request, res: Response) => {
  try {
    const programAddress = q(req, 'programAddress').trim();
    if (!programAddress) return res.status(400).json({ error: 'programAddress query required' });
    const cache = readProgramCacheFromDisk();
    if (cache[programAddress] != null) return res.json(cache[programAddress]!);
    const data = await client.getLabeledProgramAccount(programAddress);
    const label = labelFromProgramResponse(data);
    if (label != null && label.trim() !== '') {
      cache[programAddress] = data;
      writeProgramCacheToDisk(cache);
    }
    res.json(data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.post('/api/programs/labeled-program-accounts', async (req: Request, res: Response) => {
  try {
    const programAddresses = Array.isArray(req.body?.programAddresses)
      ? (req.body.programAddresses as string[]).map((a: unknown) => String(a).trim()).filter(Boolean)
      : [];
    const labels: Record<string, string> = {};
    const cache = readProgramCacheFromDisk();
    const needFetch = programAddresses.filter((addr) => {
      const cached = cache[addr];
      const label = cached != null ? labelFromProgramResponse(cached) : null;
      if (label != null) {
        labels[addr] = label;
        return false;
      }
      return true;
    });
    let updated = false;
    for (let i = 0; i < needFetch.length; i += PROGRAM_LABEL_CONCURRENCY) {
      const batch = needFetch.slice(i, i + PROGRAM_LABEL_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (addr) => {
          try {
            const data = await client.getLabeledProgramAccount(addr);
            const label = labelFromProgramResponse(data);
            if (label != null && label.trim() !== '') {
              cache[addr] = data;
              updated = true;
            }
            return { addr, label: label ?? null };
          } catch {
            return { addr, label: null };
          }
        })
      );
      for (const { addr, label } of results) {
        if (label != null) labels[addr] = label;
      }
    }
    if (updated) writeProgramCacheToDisk(cache);
    res.json({ labels });
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.post('/api/token-symbols', async (req: Request, res: Response) => {
  try {
    const mints = Array.isArray(req.body?.mints)
      ? (req.body.mints as unknown[]).map((m) => String(m).trim()).filter(Boolean)
      : [];
    const symbols: Record<string, string> = {};
    const cache = readSymbolCacheFromDisk();
    const needFetch = mints.filter((mint) => {
      if (cache[mint] != null) {
        symbols[mint] = (cache[mint] ?? '').replace(/\0/g, '').trim();
        return false;
      }
      return true;
    });
    if (needFetch.length > 0) {
      let cacheUpdated = false;
      const results = await Promise.all(
        needFetch.map(async (mint) => {
          try {
            let symbol = await getTokenSymbol(mint);
            if (symbol === mint || symbol.trim() === '') {
              try {
                const token = await client.getToken(mint);
                symbol = (token.symbol ?? '').trim() || mint;
              } catch {
                symbol = mint;
              }
            }
            const out = symbol || mint;
            if (symbol !== '' && symbol !== mint) {
              cache[mint] = out;
              cacheUpdated = true;
            }
            return { mint, symbol: out };
          } catch {
            return { mint, symbol: mint };
          }
        })
      );
      for (const { mint, symbol } of results) {
        symbols[mint] = symbol;
      }
      if (cacheUpdated) writeSymbolCacheToDisk(cache);
    }
    res.json({ symbols });
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
    res.status(status).json({ error: toHumanReadableError(err) });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open in browser to view historical trades.');
});

