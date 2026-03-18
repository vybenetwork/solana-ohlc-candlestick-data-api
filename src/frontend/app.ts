/**
 * Historical trades UI — built from TypeScript; compiles to public/app.js.
 * No imports to keep a single-file build (tsc emits one script).
 */

interface CrosshairParam {
  time?: number;
  seriesData?: Map<unknown, { open?: number; high?: number; low?: number; close?: number }>;
}

declare const LightweightCharts: {
  createChart: (container: HTMLElement, options?: unknown) => {
    addCandlestickSeries: (options?: unknown) => {
      setData: (data: Array<{ time: number; open: number; high: number; low: number; close: number }>) => void;
    };
    subscribeCrosshairMove: (callback: (param: CrosshairParam) => void) => void;
    timeScale: () => {
      subscribeVisibleLogicalRangeChange: (callback: (range: { from: number; to: number } | null) => void) => void;
      setVisibleLogicalRange: (range: { from: number; to: number } | null) => void;
      getVisibleLogicalRange: () => { from: number; to: number } | null;
      fitContent: () => void;
    };
    resize: (width: number, height: number) => void;
  };
};

interface VybeTrade {
  authorityAddress?: string;
  feePayerAddress?: string;
  baseMintAddress?: string;
  quoteMintAddress?: string;
  marketAddress?: string;
  programAddress?: string;
  signature?: string;
  blockTime?: number;
  price?: string;
  baseSize?: string;
  quoteSize?: string;
  [key: string]: unknown;
}

interface TradesResponse {
  data?: VybeTrade[];
  [key: string]: unknown;
}

interface VybeToken {
  mintAddress: string;
  symbol?: string;
  name?: string;
  logoUrl?: string;
  decimal?: number;
  decimals?: number;
  verified?: boolean;
  category?: string;
  subcategory?: string;
  price?: number;
  marketCap?: number;
  usdValueVolume24h?: number;
  tokenAmountVolume24h?: number;
  updateTime?: number;
  holders?: number;
  [key: string]: unknown;
}

interface TokenSymbolResponse {
  symbol?: string;
  error?: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const mintAddressInput = document.getElementById('mintAddress') as HTMLInputElement;
const timeStartInput = document.getElementById('timeStart') as HTMLInputElement;
const timeEndInput = document.getElementById('timeEnd') as HTMLInputElement;
const limitSelect = document.getElementById('limit') as HTMLSelectElement;
const sortSelect = document.getElementById('sort') as HTMLSelectElement;
const pageFromInput = document.getElementById('pageFrom') as HTMLInputElement;
const pageToInput = document.getElementById('pageTo') as HTMLInputElement;
const eliminateCloseToOpenGapsCheckbox = document.getElementById('eliminateCloseToOpenGaps') as HTMLInputElement | null;
const maxPagesInput = document.getElementById('maxPages') as HTMLInputElement | null;

const fetchBtn = document.getElementById('fetchBtn') as HTMLButtonElement;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
const exportAllBtn = document.getElementById('exportAllBtn') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
const tradesLoading = document.getElementById('tradesLoading') as HTMLElement;
const tradesLoadingText = document.getElementById('tradesLoadingText') as HTMLElement | null;


const localProgramInput = document.getElementById('localProgram') as HTMLInputElement | null;
const localSignatureInput = document.getElementById('localSignature') as HTMLInputElement | null;
const localFeePayerInput = document.getElementById('localFeePayer') as HTMLInputElement;
const localAuthorityInput = document.getElementById('localAuthority') as HTMLInputElement;
const authorityEqualsFeePayerCheckbox = document.getElementById('authorityEqualsFeePayer') as HTMLInputElement;
const filterWicksCheckbox = document.getElementById('filterWicks') as HTMLInputElement | null;
const wickLookbackInput = document.getElementById('wickLookback') as HTMLInputElement | null;
const wickDeviationPctInput = document.getElementById('wickDeviationPct') as HTMLInputElement | null;
const perQuoteFiltersContainer = document.getElementById('perQuoteFiltersContainer') as HTMLElement;

let wickFilteredTradesByQuote = new Map<string, VybeTrade[]>();

const tradesError = document.getElementById('tradesError') as HTMLElement;
const tradesMeta = document.getElementById('tradesMeta') as HTMLElement;
const tradesSummaryEl = document.getElementById('tradesSummary') as HTMLElement | null;
const tradesSummaryCountEl = document.getElementById('tradesSummaryCount') as HTMLElement | null;
const tradesSummaryProgramsEl = document.getElementById('tradesSummaryPrograms') as HTMLElement | null;
const tradesSummaryMarketsEl = document.getElementById('tradesSummaryMarkets') as HTMLElement | null;
const tradesSummaryQuotesEl = document.getElementById('tradesSummaryQuotes') as HTMLElement | null;
const tradesSummaryTimeEl = document.getElementById('tradesSummaryTime') as HTMLElement | null;
const tradesBody = document.getElementById('tradesBody') as HTMLElement;

const tokenLoading = document.getElementById('tokenLoading') as HTMLElement;
const tokenError = document.getElementById('tokenError') as HTMLElement;
const tokenLogo = document.getElementById('tokenLogo') as HTMLImageElement;
const tokenSymbol = document.getElementById('tokenSymbol') as HTMLElement;
const tokenName = document.getElementById('tokenName') as HTMLElement;
const tokenMint = document.getElementById('tokenMint') as HTMLElement;
const tokenDecimals = document.getElementById('tokenDecimals') as HTMLElement;
const tokenVerified = document.getElementById('tokenVerified') as HTMLElement;
const tokenCategory = document.getElementById('tokenCategory') as HTMLElement;
const tokenPriceUsd = document.getElementById('tokenPriceUsd') as HTMLElement;
const tokenMarketCapUsd = document.getElementById('tokenMarketCapUsd') as HTMLElement;
const tokenVolume24hUsd = document.getElementById('tokenVolume24hUsd') as HTMLElement;
const tokenVolume24hToken = document.getElementById('tokenVolume24hToken') as HTMLElement;
const tokenUpdateTime = document.getElementById('tokenUpdateTime') as HTMLElement;


const candlesLoading = document.getElementById('candlesLoading') as HTMLElement | null;
const candlesError = document.getElementById('candlesError') as HTMLElement | null;
const candlesResolutionSelect = document.getElementById('candlesResolution') as HTMLSelectElement | null;
const candlesSourceSelect = document.getElementById('candlesSourceSelect') as HTMLSelectElement | null;
const candlesMarketAddressInput = document.getElementById('candlesMarketAddress') as HTMLInputElement | null;
const candlesMarketAddressWrap = document.getElementById('candlesMarketAddressWrap') as HTMLElement | null;
const candlesPagesInput = document.getElementById('candlesPages') as HTMLSelectElement | null;
const candlesPagesWrap = document.getElementById('candlesPagesWrap') as HTMLElement | null;
const candlesPagesProgress = document.getElementById('candlesPagesProgress') as HTMLElement | null;
const chartQuotesWrap = document.getElementById('chartQuotesWrap') as HTMLElement | null;
const chartQuoteSelect = document.getElementById('chartQuoteSelect') as HTMLSelectElement | null;
const perQuoteSectionEl = document.getElementById('perQuoteSection');
const localNoGapsTarget = document.getElementById('localNoGapsTarget');
const remoteNoGapsTarget = document.getElementById('remoteNoGapsTarget');
const noGapsSwitchWrap = document.getElementById('noGapsSwitchWrap');
const candlesChartEl = document.getElementById('candlesChart') as HTMLElement | null;

/** Vybe explorer: wallet links only (vybe.fyi supports wallets, not markets/programs/mints). */
const VYBE_ACCOUNT = 'https://vybe.fyi/wallet/';
/** Solscan for transactions, markets, programs, and token/mint accounts. */
const SOLSCAN_TX = 'https://solscan.io/tx/';
const SOLSCAN_ACCOUNT = 'https://solscan.io/account/';

const MAX_FETCH_RETRIES = 5;
const FETCH_RETRY_DELAY_MS = 2000;

let lastRemoteTrades: VybeTrade[] = [];
let lastFilteredTrades: VybeTrade[] = [];
// Local-filtered trades excluding per-quote rules. Used to keep the per-quote table stable while tweaking per-quote min/max.
let lastFilteredTradesForPerQuote: VybeTrade[] = [];
let lastBaseSymbol: string | undefined;
const quoteSymbolCache: Record<string, string> = {};
const programLabelCache: Record<string, string> = {};
/** Per-quote-mint filter rules (key = quote mint address). Empty max = no cap. */
const perQuoteRules: Record<string, { minQuoteSize?: number; maxQuoteSize?: number; minPrice?: number; maxPrice?: number }> = {};
/** Persist per-quote table expanded/collapsed state across rebuilds. */
let perQuoteExpanded = false;
/** Quote mints excluded via per-quote table checkbox. */
const excludedQuoteMints = new Set<string>();
/** Market (pool) addresses excluded via per-quote sub-row checkbox. */
const excludedMarkets = new Set<string>();
/** Quote mint -> market addresses (for that quote). Updated in buildLocalFilterRows so we can include a quote's markets when user unchecks the quote. */
let lastQuoteToMarketsList = new Map<string, string[]>();
/** Market address -> quote mint (parent quote). So when user includes a market we can also include its quote. */
let lastMarketToQuote = new Map<string, string>();

let candlesChart:
  | {
      resize: (width: number, height: number) => void;
      addCandlestickSeries: (options?: unknown) => { setData: (data: Candle[]) => void };
      subscribeCrosshairMove: (callback: (param: CrosshairParam) => void) => void;
      timeScale: () => {
        subscribeVisibleLogicalRangeChange: (callback: (range: { from: number; to: number } | null) => void) => void;
        setVisibleLogicalRange: (range: { from: number; to: number } | null) => void;
        getVisibleLogicalRange: () => { from: number; to: number } | null;
        fitContent: () => void;
      };
    }
  | null = null;
let candlesSeries: { setData: (data: Candle[]) => void } | null = null;
let lastCandlesFromApi: Candle[] = [];
let lastCandlesFromTrades: Candle[] = [];
/** Number of bars currently on the chart; used to clamp scroll so we can't scroll past the oldest candle. */
let candlesBarCount = 0;
/** Current candles on chart; used for overlay lookup by time on crosshair move. */
let lastCandlesForTooltip: Candle[] = [];
const candlesChartOverlay = document.getElementById('candlesChartOverlay') as HTMLElement | null;

const STABLE_QUOTE_SYMBOLS = new Set(['USD', 'USDC', 'USDT', 'PYUSD', 'USD1']);

/** Hardcoded mint → symbol; never fetch these from API. */
const HARDCODED_QUOTE_MINTS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'wSOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX: 'USDH',
};

/** Quote mints we use for candle price (USD-stable). Same five as VYBE_OHLC_FULL_ALLOWED_QUOTE_MINTS. */
const CANDLE_QUOTE_MINTS = new Set<string>([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD
  'EVLXHuz4aM57CiqMhPgZpzurwBGvxeZBBAGSVFAfsmN', // USD1
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX', // USDH
]);

/** When "Vybe OHLC API (Full)" is selected, only trades in markets that have one of these mints (base or quote) are shown. */
const VYBE_OHLC_FULL_ALLOWED_QUOTE_MINTS = new Set<string>([
  'So11111111111111111111111111111111111111112', // wSOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD
  'EVLXHuz4aM57CiqMhPgZpzurwBGvxeZBBAGSVFAfsmN', // USD1
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX', // USDH
]);

/** Chart quote options: up to 5 selectable. Default all selected. */
const CHART_QUOTE_OPTIONS: { mint: string; label: string }[] = [
  { mint: 'So11111111111111111111111111111111111111112', label: 'WSOL' },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC' },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', label: 'USDT' },
  { mint: 'EVLXHuz4aM57CiqMhPgZpzurwBGvxeZBBAGSVFAfsmN', label: 'USDT1' },
  { mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', label: 'USD1' },
];
function getSelectedChartQuoteMint(): string {
  const v = chartQuoteSelect?.value?.trim();
  if (v) return v;
  return CHART_QUOTE_OPTIONS[0]!.mint;
}

/** Well-known DEX program IDs → label (used when labeled-program-account has no match). Matches token-stats repo. */
const WELL_KNOWN_PROGRAMS: Record<string, string> = {
  '675kPX9MHTjS2zt1qwr1sgbV5tjF6n5paF8GcaxHfL8r': 'Raydium',
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP': 'Orca',
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'Pump.fun',
  'EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gje1wcB3NH': 'Orca (Whirlpool)',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
  'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C': 'Raydium CPMM',
  'Gswppe6ERWKpUTXvRPfXdzHhiCyJvLadVvXGfdpBqcE1': 'Guac Swap',
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY': 'Phoenix',
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo': 'Meteora',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
};

let fetchClickedOnce = false;
/** Only allow candle fetch/refresh after user has clicked Fetch Candles (or Fetch Trades for Candles). */
let userHasClickedFetchCandles = false;

// Draw attention to Fetch trades until first click.
fetchBtn.classList.add('fetch-btn-attention');

interface ProgramItem {
  programAddress?: string;
  name?: string;
  label?: string;
  labels?: string[];
  symbol?: string;
}

function showInlineError(el: HTMLElement, msg: string): void {
  el.textContent = msg;
  el.hidden = false;
  el.removeAttribute('aria-hidden');
}

function clearInlineError(el: HTMLElement): void {
  el.textContent = '';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
}

function showError(msg: string): void {
  tradesError.textContent = msg;
  tradesError.hidden = false;
  tradesError.removeAttribute('aria-hidden');
}

function clearError(): void {
  tradesError.textContent = '';
  tradesError.hidden = true;
  tradesError.setAttribute('aria-hidden', 'true');
}

function truncate(s: string | undefined, front = 4, back = 4): string {
  if (!s) return '—';
  if (s.length <= front + back + 4) return s;
  return s.slice(0, front) + '....' + s.slice(-back);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtNum(n: number, maxFrac: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

/** For 0 < n < 0.1: at most 3 digits after the leading zeros (e.g. 0.002978518 → 0.00297). Returns null otherwise. */
function fmtTrailingAfterZero(n: number): string | null {
  const abs = Math.abs(n);
  if (abs >= 0.1 || abs === 0) return null;
  const s = abs.toFixed(10);
  if (!s.startsWith('0.')) return null;
  let i = 2;
  while (i < s.length && s[i] === '0') i++;
  if (i >= s.length) return (n < 0 ? '-' : '') + s;
  const prefix = s.slice(0, i);
  const threeDigits = s.slice(i, i + 3);
  const result = (n < 0 ? '-' : '') + prefix + threeDigits;
  return result;
}

/** For 0.1 <= n < 1: at most 3 decimal places, truncated (e.g. 0.147888131 → 0.147). Returns null otherwise. */
function fmtPointOneToOne(n: number): string | null {
  const abs = Math.abs(n);
  if (abs < 0.1 || abs >= 1) return null;
  const truncated = Math.floor(n * 1000) / 1000;
  return truncated.toString();
}

function fmtMaybeNumber(v: unknown, maxFrac = 2): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return fmtNum(n, maxFrac);
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function toSuperscript(exp: number): string {
  if (exp >= 0) return SUPERSCRIPT_DIGITS[exp] ?? String(exp);
  const s = String(exp);
  return '⁻' + s.slice(1).replace(/\d/g, (d) => SUPERSCRIPT_DIGITS[Number(d)] ?? d);
}

/** Compact form for small numbers: 0.0ⁿ + 3 digits, where ⁿ = number of zeros after 0.0 (e.g. 0.0⁸736). Returns null if not in range. */
function fmtSmallNumber(n: number): string | null {
  const abs = Math.abs(n);
  if (abs === 0 || abs >= 0.001) return null;
  const exp = Math.floor(Math.log10(abs));
  const numZeros = -exp; // e.g. 10^-8 → 8 zeros after 0.0
  const mantissa = n * 10 ** -exp;
  const rounded = Math.round(mantissa * 100) / 100;
  const digits = String(rounded.toFixed(2)).replace('.', '').replace(/0+$/, '');
  return `0.0${toSuperscript(numZeros)}${digits}`;
}

function fmtUsd(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  const small = fmtSmallNumber(n);
  if (small !== null) return `$${small}`;
  const trailing = fmtTrailingAfterZero(n);
  if (trailing !== null) return `$${trailing}`;
  const pointOneToOne = fmtPointOneToOne(n);
  if (pointOneToOne !== null) return `$${pointOneToOne}`;
  const abs = Math.abs(n);
  const maxFrac = abs >= 9.99 ? 0 : abs >= 1 ? 2 : 9;
  return `$${fmtNum(n, maxFrac)}`;
}

function fmtTokenAmount(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  const small = fmtSmallNumber(n);
  if (small !== null) return small;
  const trailing = fmtTrailingAfterZero(n);
  if (trailing !== null) return trailing;
  const pointOneToOne = fmtPointOneToOne(n);
  if (pointOneToOne !== null) return pointOneToOne;
  const abs = Math.abs(n);
  const maxFrac = abs >= 10 ? 0 : abs >= 1 ? 2 : 4;
  return fmtNum(n, maxFrac);
}

function fmtPriceAmount(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  const small = fmtSmallNumber(n);
  if (small !== null) return small;
  const trailing = fmtTrailingAfterZero(n);
  if (trailing !== null) return trailing;
  const pointOneToOne = fmtPointOneToOne(n);
  if (pointOneToOne !== null) return pointOneToOne;
  const abs = Math.abs(n);
  const maxFrac = abs >= 10 ? 0 : abs >= 1 ? 2 : 9;
  return fmtNum(n, maxFrac);
}

/** Format volume: commas; if >= 100,000,000 use M/B/T then append symbol (e.g. "5.85B BONK"). */
function formatVolumeWithSymbol(value: number, symbol: string): string {
  if (!Number.isFinite(value)) return '—';
  const sym = (symbol && symbol !== '—') ? ` ${symbol}` : '';
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T' + sym;
  if (abs >= 1e9) return (value / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B' + sym;
  if (abs >= 1e8) return (value / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' + sym;
  return Math.round(value).toLocaleString() + sym;
}

/** Format Unix seconds as time only (e.g. "14:32:00"). */
function formatTimeOnly(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds)) return '—';
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/** Format Unix seconds as date with 2-digit year (e.g. "13/03/26"). */
function formatDateYY(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds)) return '—';
  const d = new Date(unixSeconds * 1000);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${yy}`;
}

/** Format Unix seconds as time first, then date with 2-digit year (e.g. "14:32 13/03/26"). */
function formatTimeFirstDateYY(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds)) return '—';
  return `${formatTimeOnly(unixSeconds)} ${formatDateYY(unixSeconds)}`;
}

/** Pad O/H/L/C strings to same length with trailing zeros (after decimal). */
function padOhlcToSameLength(open: string, high: string, low: string, close: string): { open: string; high: string; low: string; close: string } {
  const arr = [open, high, low, close];
  const maxDecimals = Math.max(
    ...arr.map((s) => {
      const i = s.indexOf('.');
      return i === -1 ? 0 : s.length - i - 1;
    })
  );
  const padOne = (s: string): string => {
    const i = s.indexOf('.');
    if (i === -1) return maxDecimals > 0 ? s + '.' + '0'.repeat(maxDecimals) : s;
    const after = s.slice(i + 1);
    return s + '0'.repeat(Math.max(0, maxDecimals - after.length));
  };
  return {
    open: padOne(open),
    high: padOne(high),
    low: padOne(low),
    close: padOne(close),
  };
}

function formatPriceForChart(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1) {
    const maxFrac = abs >= 100 ? 0 : abs >= 10 ? 2 : 4;
    return sign + Math.abs(n).toFixed(maxFrac);
  }
  const s = abs.toFixed(12);
  const dot = s.indexOf('.');
  const afterDot = dot >= 0 ? s.slice(dot + 1) : '';
  let zeros = 0;
  for (const c of afterDot) {
    if (c === '0') zeros++;
    else break;
  }
  if (zeros >= afterDot.length) {
    return sign + s.replace(/0+$/, '');
  }
  const firstNonZeroIndex = (dot >= 0 ? dot + 1 : 0) + zeros;
  const end = Math.min(s.length, firstNonZeroIndex + 3);
  const trimmed = s.slice(0, end).replace(/0+$/, '');
  return sign + trimmed;
}

function quoteSymOrTrunc(quoteMint: string | undefined): string {
  if (!quoteMint) return '—';
  return quoteSymbolCache[quoteMint] || HARDCODED_QUOTE_MINTS[quoteMint] || truncate(quoteMint);
}

/** Show SOL instead of wSOL in the trades table. */
function displaySymbol(sym: string): string {
  return sym === 'wSOL' ? 'SOL' : sym;
}

/** Truncate symbol to first 5 characters (no ellipsis) for table display. */
function symbolMax5(sym: string): string {
  if (!sym) return sym;
  return sym.length > 5 ? sym.slice(0, 5) : sym;
}

/** Wrap amount/price HTML: stables = light green, SOL = light purple. When NOT the analysed mint and symbol is other = light yellow value + yellow symbol. */
function wrapAmountClass(html: string, sym: string, isAnalysedMint = false): string {
  const d = displaySymbol(sym);
  if (isStableQuoteSymbol(sym)) return `<span class="amount-usdc">${html}</span>`;
  if (d === 'SOL') return `<span class="amount-sol">${html}</span>`;
  if (isAnalysedMint) return html;
  const lastSpace = html.lastIndexOf(' ');
  if (lastSpace === -1) return `<span class="amount-other-value">${html}</span>`;
  const valuePart = html.slice(0, lastSpace);
  const symbolPart = html.slice(lastSpace + 1);
  return `<span class="amount-other-value">${valuePart}</span> <span class="amount-other-symbol">${symbolPart}</span>`;
}

function isStableQuoteSymbol(sym: string): boolean {
  return STABLE_QUOTE_SYMBOLS.has(sym.toUpperCase());
}

function vybeLinkAccount(addr: string | undefined, text?: string): string {
  if (!addr) return '—';
  const href = VYBE_ACCOUNT + encodeURIComponent(addr);
  const label = text ?? truncate(addr, 3, 3);
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${addr}">${label}</a>`;
}

/** Solscan link for accounts (markets, programs, mints). Use vybeLinkAccount for wallets only. */
function solscanLinkAccount(addr: string | undefined, text?: string): string {
  if (!addr) return '—';
  const href = SOLSCAN_ACCOUNT + encodeURIComponent(addr);
  const label = text ?? truncate(addr, 3, 3);
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${addr}">${label}</a>`;
}

function formatTime(blockTime: number | undefined): string {
  if (!blockTime) return '—';
  const d = new Date(blockTime * 1000);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return `${time} ${date}`;
}

function parseUnixSecondsFromDatetimeLocal(v: string): number | undefined {
  const raw = (v ?? '').trim();
  if (!raw) return undefined;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return undefined;
  return Math.floor(ms / 1000);
}

function parseNumberOrUndefined(v: string): number | undefined {
  const raw = (v ?? '').trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Format a number for display in per-quote inputs:
 * - >= 100: 0 decimals
 * - 1 to 100: 2 decimals
 * - < 1: 4 decimals, unless first non-zero is after more than 3 zeros (then show 3 non-zero digits only)
 */
function formatDecimalForDisplay(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 100) return String(Math.round(n));
  if (abs >= 1) return n.toFixed(2);
  if (abs === 0) return '0';
  const s = abs < 1e-4 ? abs.toFixed(14) : abs.toString();
  const dot = s.indexOf('.');
  const afterDot = dot >= 0 ? s.slice(dot + 1) : '';
  let zeros = 0;
  for (const c of afterDot) {
    if (c === '0') zeros++;
    else break;
  }
  if (zeros >= 3) return n.toFixed(zeros + 3);
  return n.toFixed(4);
}

function parseIntOrUndefined(v: string): number | undefined {
  const n = parseNumberOrUndefined(v);
  if (n == null) return undefined;
  return Math.max(0, Math.trunc(n));
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY_MS));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

function buildTradesParamsBase(): URLSearchParams {
  const params = new URLSearchParams();

  const mintAddress = mintAddressInput.value.trim();
  if (mintAddress) params.set('mintAddress', mintAddress);

  const timeStart = parseUnixSecondsFromDatetimeLocal(timeStartInput.value);
  if (timeStart != null) params.set('timeStart', String(timeStart));
  const timeEnd = parseUnixSecondsFromDatetimeLocal(timeEndInput.value);
  if (timeEnd != null) params.set('timeEnd', String(timeEnd));

  return params;
}

function buildTradesQueryForTable(pageOverride?: number): string {
  const params = buildTradesParamsBase();
  const limit = Number(limitSelect.value);
  if (Number.isFinite(limit)) params.set('limit', String(limit));
  const page =
    pageOverride != null ? Math.max(0, Math.trunc(pageOverride)) : Math.max(0, Math.trunc(Number(pageFromInput.value || '0')));
  params.set('page', String(page));

  const [sortField, sortDir] = (sortSelect.value || 'blockTime:desc').split(':');
  if (sortField && sortDir === 'asc') params.set('sortByAsc', sortField);
  if (sortField && sortDir === 'desc') params.set('sortByDesc', sortField);

  return params.toString();
}

function applyLocalFiltersCore(trades: VybeTrade[], includePerQuoteRules: boolean, includeExclusions: boolean): VybeTrade[] {
  const localProgram = (localProgramInput?.value ?? '').trim().toLowerCase();
  const localSignature = (localSignatureInput?.value ?? '').trim().toLowerCase();
  const localFeePayer = (localFeePayerInput?.value ?? '').trim().toLowerCase();
  const localAuthority = (localAuthorityInput?.value ?? '').trim().toLowerCase();
  const authorityEqualsFeePayer = authorityEqualsFeePayerCheckbox?.checked === true;
  const analysedMint = mintAddressInput.value.trim();

  return trades.filter((t) => {
    if (localProgram) {
      const p = (t.programAddress ?? '').toLowerCase();
      if (!p.includes(localProgram)) return false;
    }

    if (localSignature) {
      const sig = (t.signature ?? '').toLowerCase();
      if (!sig.includes(localSignature)) return false;
    }

    if (localFeePayer) {
      const fp = (t.feePayerAddress ?? '').toLowerCase();
      if (!fp.includes(localFeePayer)) return false;
    }

    if (localAuthority) {
      const auth = (t.authorityAddress ?? '').toLowerCase();
      if (!auth.includes(localAuthority)) return false;
    }

    if (authorityEqualsFeePayer) {
      const auth = (t.authorityAddress ?? '').trim();
      const fee = (t.feePayerAddress ?? '').trim();
      if (!auth || !fee || auth !== fee) return false;
    }

    // Exclusions from per-quote table.
    if (includeExclusions && analysedMint) {
      const other = otherMint(t, analysedMint).trim();
      if (other && excludedQuoteMints.has(other)) return false;
    }

    if (includeExclusions) {
      const m = (t.marketAddress ?? '').trim();
      if (m && excludedMarkets.has(m)) return false;
    }

    if (includePerQuoteRules) {
      const quoteMint = otherMint(t, analysedMint || '');
      const ruleQ = quoteMint ? perQuoteRules[quoteMint] : undefined;
      if (ruleQ) {
        const quoteMintAddr = (t.quoteMintAddress ?? '').trim();
        const sizeQ = quoteMintAddr === quoteMint ? Number(t.quoteSize) : Number(t.baseSize);
        const priceQ =
          quoteMintAddr === quoteMint
            ? Number(t.price)
            : (() => {
                const p = Number(t.price);
                return Number.isFinite(p) && p !== 0 ? 1 / p : NaN;
              })();
        if (ruleQ.minQuoteSize != null) {
          if (!Number.isFinite(sizeQ) || sizeQ < ruleQ.minQuoteSize) return false;
        }
        if (ruleQ.maxQuoteSize != null) {
          if (!Number.isFinite(sizeQ) || sizeQ > ruleQ.maxQuoteSize) return false;
        }
        if (ruleQ.minPrice != null) {
          if (!Number.isFinite(priceQ) || priceQ < ruleQ.minPrice) return false;
        }
        if (ruleQ.maxPrice != null) {
          if (!Number.isFinite(priceQ) || priceQ > ruleQ.maxPrice) return false;
        }
      }
    }

    return true;
  });
}

function applyLocalFilters(trades: VybeTrade[]): VybeTrade[] {
  return applyLocalFiltersCore(trades, true, true);
}

function applyLocalFiltersWithoutPerQuoteRules(trades: VybeTrade[]): VybeTrade[] {
  return applyLocalFiltersCore(trades, false, true);
}

function applyLocalFiltersWithoutExclusionsAndPerQuoteRules(trades: VybeTrade[]): VybeTrade[] {
  return applyLocalFiltersCore(trades, false, false);
}

/** When candles source is "Vybe OHLC API (Full)", only these trades are shown. When "Rebuild from trades" or "Vybe OHLC by Market API", all fetched trades are used. */
function getRemoteTradesForDisplay(): VybeTrade[] {
  if (candlesSourceSelect?.value === 'full') {
    return lastRemoteTrades.filter((t) => {
      const base = (t.baseMintAddress ?? '').trim();
      const quote = (t.quoteMintAddress ?? '').trim();
      return VYBE_OHLC_FULL_ALLOWED_QUOTE_MINTS.has(base) || VYBE_OHLC_FULL_ALLOWED_QUOTE_MINTS.has(quote);
    });
  }
  return lastRemoteTrades;
}

/** Trades to show in the table (and export). When "Rebuild from trades", filter by selected chart quote so table matches chart. */
function getTradesForTableDisplay(): VybeTrade[] {
  if (candlesSourceSelect?.value !== 'trades') return lastFilteredTrades;
  const baseMint = mintAddressInput.value.trim();
  const chartQuote = getSelectedChartQuoteMint();
  if (!chartQuote) return lastFilteredTrades;
  return lastFilteredTrades.filter((t) => otherMint(t, baseMint) === chartQuote);
}

const TOP_QUOTE_MINTS_FOR_FILTER = 10;

/** Observed min/max from last fetch, used to lock per-quote inputs. */
let quoteBounds: Record<string, { minQuoteSize: number; maxQuoteSize: number; minPrice: number; maxPrice: number }> = {};

/**
 * Build dynamic per-quote filter rows from lastFilteredTradesForPerQuote.
 * Preserves existing rule values. Min/max inputs are locked to observed range in the filtered set.
 * Rebuilds when local filters change so counts and bounds reflect the current filtered trades.
 * @param remoteTradesOverride - When provided (e.g. after fetch with all pages), use this for bounds/counts so min/max/wick use full data.
 */
function buildLocalFilterRows(remoteTradesOverride?: VybeTrade[]): void {
  if (!perQuoteFiltersContainer) return;
  const baseMint = mintAddressInput.value.trim();
  const remoteForDisplay = remoteTradesOverride ?? getRemoteTradesForDisplay();

  // Total counts from loaded trades (does not change with local filters).
  const totalQuoteCounts = new Map<string, number>();
  for (const t of remoteForDisplay) {
    const q = otherMint(t, baseMint);
    if (q && q !== baseMint) totalQuoteCounts.set(q, (totalQuoteCounts.get(q) ?? 0) + 1);
  }

  // Filtered counts from the current trades table (includes per-quote rules).
  const filteredQuoteCounts = new Map<string, number>();
  for (const t of lastFilteredTrades) {
    const q = otherMint(t, baseMint);
    if (q && q !== baseMint) filteredQuoteCounts.set(q, (filteredQuoteCounts.get(q) ?? 0) + 1);
  }

  const quoteCounts = new Map<string, number>();
  const quoteStats = new Map<
    string,
    { minQuoteSize: number; maxQuoteSize: number; minPrice: number; maxPrice: number }
  >();

  // Bounds are computed from local filters but IGNORING exclusions and per-quote rules,
  // so excluded rows keep their place and still show meaningful min/max placeholders.
  const tradesForBounds = applyLocalFiltersWithoutExclusionsAndPerQuoteRules(remoteForDisplay);
  for (const t of tradesForBounds) {
    const q = otherMint(t, baseMint);
    if (q && q !== baseMint) {
      quoteCounts.set(q, (quoteCounts.get(q) ?? 0) + 1);
      const quoteMintAddr = (t.quoteMintAddress ?? '').trim();
      const baseMintAddr = (t.baseMintAddress ?? '').trim();
      let sizeForQ: number;
      let priceForQ: number;
      if (quoteMintAddr === q) {
        sizeForQ = Number(t.quoteSize);
        priceForQ = Number(t.price);
      } else {
        sizeForQ = Number(t.baseSize);
        const p = Number(t.price);
        priceForQ = Number.isFinite(p) && p !== 0 ? 1 / p : NaN;
      }
      const cur = quoteStats.get(q);
      if (!cur) {
        quoteStats.set(q, {
          minQuoteSize: Number.isFinite(sizeForQ) ? sizeForQ : 0,
          maxQuoteSize: Number.isFinite(sizeForQ) ? sizeForQ : 0,
          minPrice: Number.isFinite(priceForQ) ? priceForQ : 0,
          maxPrice: Number.isFinite(priceForQ) ? priceForQ : 0,
        });
      } else {
        if (Number.isFinite(sizeForQ)) {
          cur.minQuoteSize = Math.min(cur.minQuoteSize, sizeForQ);
          cur.maxQuoteSize = Math.max(cur.maxQuoteSize, sizeForQ);
        }
        if (Number.isFinite(priceForQ)) {
          cur.minPrice = Math.min(cur.minPrice, priceForQ);
          cur.maxPrice = Math.max(cur.maxPrice, priceForQ);
        }
      }
    }
  }

  quoteBounds = Object.fromEntries(quoteStats);

  // Per-market bounds (quote + market) so sub-rows show each market's own min/max.
  const marketBounds = new Map<
    string,
    Map<string, { minQuoteSize: number; maxQuoteSize: number; minPrice: number; maxPrice: number }>
  >();
  for (const t of tradesForBounds) {
    const q = otherMint(t, baseMint);
    const m = (t.marketAddress ?? '').trim();
    if (!q || q === baseMint || !m) continue;
    const quoteMintAddr = (t.quoteMintAddress ?? '').trim();
    const baseMintAddr = (t.baseMintAddress ?? '').trim();
    let sizeForQ: number;
    let priceForQ: number;
    if (quoteMintAddr === q) {
      sizeForQ = Number(t.quoteSize);
      priceForQ = Number(t.price);
    } else {
      sizeForQ = Number(t.baseSize);
      const p = Number(t.price);
      priceForQ = Number.isFinite(p) && p !== 0 ? 1 / p : NaN;
    }
    if (!marketBounds.has(q)) marketBounds.set(q, new Map());
    const byMarket = marketBounds.get(q)!;
    const cur = byMarket.get(m);
    if (!cur) {
      byMarket.set(m, {
        minQuoteSize: Number.isFinite(sizeForQ) ? sizeForQ : 0,
        maxQuoteSize: Number.isFinite(sizeForQ) ? sizeForQ : 0,
        minPrice: Number.isFinite(priceForQ) ? priceForQ : 0,
        maxPrice: Number.isFinite(priceForQ) ? priceForQ : 0,
      });
    } else {
      if (Number.isFinite(sizeForQ)) {
        cur.minQuoteSize = Math.min(cur.minQuoteSize, sizeForQ);
        cur.maxQuoteSize = Math.max(cur.maxQuoteSize, sizeForQ);
      }
      if (Number.isFinite(priceForQ)) {
        cur.minPrice = Math.min(cur.minPrice, priceForQ);
        cur.maxPrice = Math.max(cur.maxPrice, priceForQ);
      }
    }
  }

  const quoteToMarkets = new Map<
    string,
    Map<string, { totalCount: number; filteredCount: number; programAddress?: string }>
  >();
  for (const t of remoteForDisplay) {
    const q = otherMint(t, baseMint);
    const m = (t.marketAddress ?? '').trim();
    if (!q || q === baseMint || !m) continue;
    let byMarket = quoteToMarkets.get(q);
    if (!byMarket) {
      byMarket = new Map();
      quoteToMarkets.set(q, byMarket);
    }
    const entry = byMarket.get(m) ?? { totalCount: 0, filteredCount: 0 };
    entry.totalCount += 1;
    if (!entry.programAddress && t.programAddress) entry.programAddress = (t.programAddress ?? '').trim();
    byMarket.set(m, entry);
  }
  for (const t of lastFilteredTrades) {
    const q = otherMint(t, baseMint);
    const m = (t.marketAddress ?? '').trim();
    if (!q || q === baseMint || !m) continue;
    const byMarket = quoteToMarkets.get(q);
    if (byMarket?.has(m)) {
      const e = byMarket.get(m)!;
      e.filteredCount += 1;
    }
  }
  const quoteToMarketsList = new Map<
    string,
    Array<{ marketAddress: string; totalCount: number; filteredCount: number; programAddress?: string }>
  >();
  quoteToMarkets.forEach((byMarket, q) => {
    const list = [...byMarket.entries()]
      .map(([marketAddress, v]) => ({ marketAddress, ...v }))
      .sort((a, b) => b.totalCount - a.totalCount);
    quoteToMarketsList.set(q, list);
  });
  lastQuoteToMarketsList = new Map(
    [...quoteToMarketsList.entries()].map(([q, list]) => [q, list.map((x) => x.marketAddress)])
  );
  lastMarketToQuote = new Map<string, string>();
  quoteToMarketsList.forEach((list, q) => {
    for (const { marketAddress } of list) {
      lastMarketToQuote.set(marketAddress, q);
    }
  });

  // Use TOTAL counts so excluded rows don't disappear/reorder.
  // We sort all quote mints by total count, but we do NOT slice here so that
  // "Show all" truly shows all mints, even those with a single trade.
  const topQuotes = [...totalQuoteCounts.entries()].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  // Only show per-quote row for the single quote currently selected for the chart (the radio-selected slot).
  const selectedChartMint = getSelectedChartQuoteMint();
  const topQuotesForTable = selectedChartMint
    ? ([[selectedChartMint, totalQuoteCounts.get(selectedChartMint) ?? 0]] as [string, number][])
    : topQuotes;
  const hasNoTradesYet = totalQuoteCounts.size === 0;

  function quoteLabel(mint: string): string {
    return quoteSymbolCache[mint] || HARDCODED_QUOTE_MINTS[mint] || truncate(mint, 4, 4);
  }
  function quoteLabelShort(mint: string): string {
    const sym = quoteSymbolCache[mint] || HARDCODED_QUOTE_MINTS[mint];
    // If symbol lookup failed and echoed the mint (or missing), show XX...XX.
    if (!sym || sym === mint) {
      if (mint.length <= 6) return mint;
      return `${mint.slice(0, 2)}...${mint.slice(-2)}`;
    }
    // Match trades table: show SOL (not wSOL) and truncate to 5 chars.
    return symbolMax5(displaySymbol(sym));
  }

  /** Step = 1 in the last displayed digit (e.g. 0.0021 → 0.0001, 0.0000042 → 0.0000001). */
  function stepFor(v: number): number {
    if (!Number.isFinite(v)) return 0.01;
    const abs = Math.abs(v);
    if (abs >= 100) return 1;
    if (abs >= 1) return 0.01;
    if (abs === 0) return 0.0001;
    const s = abs < 1e-4 ? abs.toFixed(14) : abs.toString();
    const dot = s.indexOf('.');
    const afterDot = dot >= 0 ? s.slice(dot + 1) : '';
    let zeros = 0;
    for (const c of afterDot) {
      if (c === '0') zeros++;
      else break;
    }
    const decimals = zeros >= 3 ? zeros + 2 : 4;
    return Math.pow(10, -decimals);
  }

  function clampQuote(qMint: string, minQ?: number, maxQ?: number, minP?: number, maxP?: number) {
    const b = quoteBounds[qMint];
    if (!b) return { minQuoteSize: minQ, maxQuoteSize: maxQ, minPrice: minP, maxPrice: maxP };
    return {
      minQuoteSize: minQ != null ? Math.max(b.minQuoteSize, minQ) : undefined,
      maxQuoteSize: maxQ != null ? Math.min(b.maxQuoteSize, maxQ) : undefined,
      minPrice: minP != null ? Math.max(b.minPrice, minP) : undefined,
      maxPrice: maxP != null ? Math.min(b.maxPrice, maxP) : undefined,
    };
  }

  perQuoteFiltersContainer.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>Quote</th><th style="text-align:center">Select All</th><th>Score</th><th>High</th><th>Low</th><th>Min price</th><th>Max price</th></tr></thead><tbody></tbody>`;
  if (topQuotesForTable.length === 0 || hasNoTradesYet) {
    const tbody = table.querySelector('tbody')!;
    const placeholderQuoteMint = getSelectedChartQuoteMint();
    const placeholderLabel =
      CHART_QUOTE_OPTIONS.find((o) => o.mint === placeholderQuoteMint)?.label ??
      HARDCODED_QUOTE_MINTS[placeholderQuoteMint] ??
      truncate(placeholderQuoteMint, 4, 4);
    const mainRow = document.createElement('tr');
    mainRow.dataset.quoteMint = placeholderQuoteMint;
    mainRow.innerHTML = `
      <td title="${placeholderQuoteMint}"><div>${escapeHtml(placeholderLabel)}</div><div class="meta">(0/0)</div></td>
      <td style="text-align:center"><label class="per-quote-status"><input type="checkbox" class="per-quote-exclude" checked aria-label="Include ${escapeHtml(placeholderLabel)}" /><span class="per-quote-status-text">Included</span></label></td>
      <td class="per-quote-main-wick-cell">—</td>
      <td class="per-quote-main-price-cell">—</td>
      <td class="per-quote-main-price-cell">—</td>
      <td class="per-quote-main-price-cell">—</td>
      <td class="per-quote-main-price-cell">—</td>
    `;
    tbody.appendChild(mainRow);
    const subRow = document.createElement('tr');
    subRow.className = 'per-quote-market-row';
    subRow.innerHTML = `
      <td class="per-quote-market-cell"><span class="per-quote-market-indent"></span>—</td>
      <td class="per-quote-market-status-cell" style="text-align:center">—</td>
      <td class="per-quote-wick-cell per-quote-score-cell">—</td>
      <td class="per-quote-market-details">—</td>
      <td class="per-quote-market-details">—</td>
      <td class="per-quote-market-details">—</td>
      <td class="per-quote-market-details">—</td>
    `;
    tbody.appendChild(subRow);
    perQuoteFiltersContainer.appendChild(table);
    return;
  }
  {
    const thead = table.querySelector('thead')!;
    const headerActionRow = document.createElement('tr');
    headerActionRow.className = 'per-quote-exclude-all-row';
    const headerActionCell = document.createElement('th');
    headerActionCell.colSpan = 7;
    headerActionCell.className = 'per-quote-exclude-all-cell';
    const excludeAllBtn = document.createElement('button');
    excludeAllBtn.type = 'button';
    excludeAllBtn.className = 'per-quote-exclude-all-btn';
    excludeAllBtn.textContent = 'Exclude all';
    excludeAllBtn.title = 'Exclude every quote and every market (check all exclude boxes)';
    excludeAllBtn.addEventListener('click', () => {
      for (const [quoteMint] of topQuotesForTable) excludedQuoteMints.add(quoteMint);
      for (const [quoteMint] of topQuotesForTable) {
        const list = quoteToMarketsList.get(quoteMint);
        if (list) for (const { marketAddress } of list) excludedMarkets.add(marketAddress);
      }
      buildLocalFilterRows();
      onLocalFilterChange();
    });
    headerActionCell.appendChild(excludeAllBtn);
    headerActionRow.appendChild(headerActionCell);
    thead.insertBefore(headerActionRow, thead.firstChild);
    const tbody = table.querySelector('tbody')!;
    const TOP_VISIBLE = 100000; /* show all quote rows and market sub-rows */
    for (let i = 0; i < topQuotesForTable.length; i++) {
      const [quoteMint, count] = topQuotesForTable[i];
      const b = quoteBounds[quoteMint];
      const tr = document.createElement('tr');
      const isExcluded = excludedQuoteMints.has(quoteMint);
      const minP = b?.minPrice;
      const maxP = b?.maxPrice;
      const fmt = (x: number | undefined) => (x != null && Number.isFinite(x) ? formatDecimalForDisplay(x) : '—');
      const quoteSym = quoteLabelShort(quoteMint);
      const totalForMint = totalQuoteCounts.get(quoteMint) ?? count;
      const filteredForMint = filteredQuoteCounts.get(quoteMint) ?? 0;
      const minPStr = fmt(minP) + (minP != null && Number.isFinite(minP) ? ' ' + quoteSym : '');
      const maxPStr = fmt(maxP) + (maxP != null && Number.isFinite(maxP) ? ' ' + quoteSym : '');
      tr.innerHTML = `
        <td title="${quoteMint}"><div>${quoteSym}</div><div class="meta">(${isExcluded ? 0 : filteredForMint}/${totalForMint})</div></td>
        <td style="text-align:center"><label class="per-quote-status"><input type="checkbox" class="per-quote-exclude" ${!isExcluded ? 'checked' : ''} aria-label="Include ${quoteSym}" /><span class="per-quote-status-text">${isExcluded ? 'Excluded' : 'Included'}</span></label></td>
        <td class="per-quote-main-wick-cell"></td>
        <td class="per-quote-main-price-cell"></td>
        <td class="per-quote-main-price-cell"></td>
        <td class="per-quote-main-price-cell">${escapeHtml(minPStr)}</td>
        <td class="per-quote-main-price-cell">${escapeHtml(maxPStr)}</td>
      `;
      tr.dataset.quoteMint = quoteMint;
      tr.classList.toggle('per-quote-row-excluded', isExcluded);
      if (i >= TOP_VISIBLE) {
        tr.classList.add('per-quote-row-collapsible');
        if (!perQuoteExpanded) tr.classList.add('per-quote-row-hidden');
      }
      const excludeCb = tr.querySelector('.per-quote-exclude') as HTMLInputElement | null;
      const statusText = tr.querySelector('.per-quote-status-text') as HTMLElement | null;
      if (excludeCb) {
        const updateStatusText = () => {
          if (!statusText) return;
          statusText.textContent = excludeCb.checked ? 'Included' : 'Excluded';
        };
        updateStatusText();
        excludeCb.addEventListener('change', () => {
          if (excludeCb.checked) {
            excludedQuoteMints.delete(quoteMint);
            const marketsForQuote = lastQuoteToMarketsList.get(quoteMint);
            if (marketsForQuote) {
              for (const m of marketsForQuote) excludedMarkets.delete(m);
            }
          } else {
            excludedQuoteMints.add(quoteMint);
            delete perQuoteRules[quoteMint];
            const marketsForQuote = lastQuoteToMarketsList.get(quoteMint);
            if (marketsForQuote) {
              for (const m of marketsForQuote) excludedMarkets.add(m);
            }
          }
          updateStatusText();
          onLocalFilterChange();
        });
      }
      tbody.appendChild(tr);

      const marketsList = quoteToMarketsList.get(quoteMint) ?? [];
      const resolution = candlesResolutionSelect?.value ?? '1m';
      const candlesByMarket = new Map<string, Candle[]>();
      const marketRows: Array<{
        marketAddress: string;
        totalCount: number;
        filteredCount: number;
        programAddress?: string;
        highVal: number;
        lowVal: number;
        highVsMedianPct: number;
        lowVsMedianPct: number;
      }> = [];
      for (const { marketAddress, totalCount, filteredCount, programAddress } of marketsList) {
        const candles = buildCandlesFromTradesForMarket(
          lastFilteredTrades.filter((t) => otherMint(t, baseMint) === quoteMint),
          resolution,
          baseMint,
          quoteMint,
          marketAddress
        );
        candlesByMarket.set(marketAddress, candles);
        const highVal = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : -Infinity;
        const lowVal = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : Infinity;
        const h = Number.isFinite(highVal) ? highVal : -Infinity;
        const l = Number.isFinite(lowVal) ? lowVal : Infinity;
        marketRows.push({
          marketAddress,
          totalCount,
          filteredCount,
          programAddress,
          highVal: h,
          lowVal: l,
          highVsMedianPct: 0,
          lowVsMedianPct: 0,
        });
      }

      const allHighs = marketRows.map((r) => r.highVal).filter((v) => Number.isFinite(v) && v !== -Infinity);
      const allLows = marketRows.map((r) => r.lowVal).filter((v) => Number.isFinite(v) && v !== Infinity);
      const top50Highs = [...allHighs].sort((a, b) => b - a).slice(0, 50);
      const bottom50Lows = [...allLows].sort((a, b) => a - b).slice(0, 50);
      const medianHigh = top50Highs.length > 0 ? median(top50Highs) : 0;
      const medianLow = bottom50Lows.length > 0 ? median(bottom50Lows) : 0;

      for (const row of marketRows) {
        if (medianHigh > 0 && row.highVal !== -Infinity) {
          row.highVsMedianPct = ((row.highVal - medianHigh) / medianHigh) * 100;
        }
        if (medianLow > 0 && row.lowVal !== Infinity) {
          row.lowVsMedianPct = ((row.lowVal - medianLow) / medianLow) * 100;
        }
      }

      const combinedByMarket = marketRows;
      combinedByMarket.sort((a, b) => b.totalCount - a.totalCount);

      const byHighVsMedianDesc = [...combinedByMarket].sort((a, b) => b.highVsMedianPct - a.highVsMedianPct);
      const byLowVsMedianAsc = [...combinedByMarket].sort((a, b) => a.lowVsMedianPct - b.lowVsMedianPct);
      const rowHighRank = new Map<string, number>();
      const rowLowRank = new Map<string, number>();
      byHighVsMedianDesc.forEach((e, i) => {
        if (i < 10) rowHighRank.set(e.marketAddress, i + 1);
      });
      byLowVsMedianAsc.forEach((e, i) => {
        if (i < 10) rowLowRank.set(e.marketAddress, i + 1);
      });

      const tradesForQuote = lastFilteredTrades.filter((t) => otherMint(t, baseMint) === quoteMint);
      let tradesForQuoteToUse = tradesForQuote;

      if (filterWicksCheckbox?.checked) {
        const filterMarketSet = new Set<string>();
        for (const entry of combinedByMarket) {
          const inTop10High = rowHighRank.has(entry.marketAddress);
          const inTop10Low = rowLowRank.has(entry.marketAddress);
          const extremeHigh = Number.isFinite(entry.highVsMedianPct) && entry.highVsMedianPct > 100;
          const extremeLow = Number.isFinite(entry.lowVsMedianPct) && entry.lowVsMedianPct < -100;
          const hasScore = entry.highVsMedianPct !== 0 || entry.lowVsMedianPct !== 0;
          if ((inTop10High || inTop10Low || extremeHigh || extremeLow) && hasScore) filterMarketSet.add(entry.marketAddress);
        }
        const rawLookback = Number(wickLookbackInput?.value ?? 10);
        const WICK_LOOKBACK_TRADES = Number.isFinite(rawLookback) ? Math.max(1, Math.min(500, Math.trunc(rawLookback))) : 10;
        const rawPct = Number(wickDeviationPctInput?.value ?? 0);
        const WICK_DEVIATION_PCT = Number.isFinite(rawPct) ? rawPct : 0;
        const excludedSignatures = new Set<string>();
        const getPrice = (t: VybeTrade) => {
          const base = (t.baseMintAddress ?? '').trim();
          const raw = Number(t.price);
          if (!Number.isFinite(raw) || raw <= 0) return NaN;
          return base === baseMint ? raw : 1 / raw;
        };
        const deviationFactor = WICK_DEVIATION_PCT <= 0 ? 0 : Math.max(0.01, Math.min(100, WICK_DEVIATION_PCT)) / 100;
        for (const marketAddress of filterMarketSet) {
          const marketTrades = [...tradesForQuote.filter((t) => (t.marketAddress ?? '').trim() === marketAddress)].sort(
            (a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0)
          );
          if (marketTrades.length === 0) continue;
          const entry = combinedByMarket.find((e) => e.marketAddress === marketAddress);
          if (!entry) continue;
          const inTop10High = rowHighRank.has(marketAddress);
          const inTop10Low = rowLowRank.has(marketAddress);
          const extremeHigh = Number.isFinite(entry.highVsMedianPct) && entry.highVsMedianPct > 100;
          const extremeLow = Number.isFinite(entry.lowVsMedianPct) && entry.lowVsMedianPct < -100;
          const excludeHighWick = inTop10High || extremeHigh;
          const excludeLowWick = inTop10Low || extremeLow;
          for (let i = 0; i < marketTrades.length; i++) {
            const t = marketTrades[i]!;
            const p = getPrice(t);
            if (!Number.isFinite(p) || !t.signature) continue;
            const lookbackStart = Math.max(0, i - WICK_LOOKBACK_TRADES);
            const lookbackTrades = marketTrades.slice(lookbackStart, i);
            if (lookbackTrades.length === 0) continue;
            const lookbackPrices = lookbackTrades.map((x) => getPrice(x)).filter(Number.isFinite);
            if (lookbackPrices.length === 0) continue;
            const med = median([...lookbackPrices].sort((a, b) => a - b));
            if (!Number.isFinite(med) || med <= 0) continue;
            if (deviationFactor > 0) {
              if (excludeHighWick && p >= med * (1 + deviationFactor)) excludedSignatures.add(t.signature);
              else if (excludeLowWick && p <= med * (1 - deviationFactor)) excludedSignatures.add(t.signature);
            }
          }
        }
        tradesForQuoteToUse = tradesForQuote.filter((t) => !t.signature || !excludedSignatures.has(t.signature));

        const filteredCandlesByMarket = new Map<string, Candle[]>();
        const filteredMarketRows: Array<{
          marketAddress: string;
          totalCount: number;
          filteredCount: number;
          programAddress?: string;
          highVal: number;
          lowVal: number;
          highVsMedianPct: number;
          lowVsMedianPct: number;
        }> = [];
        for (const { marketAddress, totalCount, programAddress } of marketsList) {
          const marketTradesAfterWickFilter = tradesForQuoteToUse.filter((t) => (t.marketAddress ?? '').trim() === marketAddress);
          const filteredCount = marketTradesAfterWickFilter.length;
          const candles = buildCandlesFromTradesForMarket(tradesForQuoteToUse, resolution, baseMint, quoteMint, marketAddress);
          filteredCandlesByMarket.set(marketAddress, candles);
          const highVal = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : -Infinity;
          const lowVal = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : Infinity;
          const h = Number.isFinite(highVal) ? highVal : -Infinity;
          const l = Number.isFinite(lowVal) ? lowVal : Infinity;
          filteredMarketRows.push({
            marketAddress,
            totalCount,
            filteredCount,
            programAddress,
            highVal: h,
            lowVal: l,
            highVsMedianPct: 0,
            lowVsMedianPct: 0,
          });
        }
        const filtHighs = filteredMarketRows.map((r) => r.highVal).filter((v) => Number.isFinite(v) && v !== -Infinity);
        const filtLows = filteredMarketRows.map((r) => r.lowVal).filter((v) => Number.isFinite(v) && v !== Infinity);
        const filtMedHigh = filtHighs.length > 0 ? median([...filtHighs].sort((a, b) => b - a).slice(0, 50)) : 0;
        const filtMedLow = filtLows.length > 0 ? median([...filtLows].sort((a, b) => a - b).slice(0, 50)) : 0;
        for (const row of filteredMarketRows) {
          if (filtMedHigh > 0 && row.highVal !== -Infinity) row.highVsMedianPct = ((row.highVal - filtMedHigh) / filtMedHigh) * 100;
          if (filtMedLow > 0 && row.lowVal !== Infinity) row.lowVsMedianPct = ((row.lowVal - filtMedLow) / filtMedLow) * 100;
        }
        filteredMarketRows.sort((a, b) => b.totalCount - a.totalCount);
        combinedByMarket.length = 0;
        combinedByMarket.push(...filteredMarketRows);
        const byHighFilt = [...filteredMarketRows].sort((a, b) => b.highVsMedianPct - a.highVsMedianPct);
        const byLowFilt = [...filteredMarketRows].sort((a, b) => a.lowVsMedianPct - b.lowVsMedianPct);
        rowHighRank.clear();
        rowLowRank.clear();
        byHighFilt.forEach((e, i) => { if (i < 10) rowHighRank.set(e.marketAddress, i + 1); });
        byLowFilt.forEach((e, i) => { if (i < 10) rowLowRank.set(e.marketAddress, i + 1); });
        wickFilteredTradesByQuote.set(quoteMint, tradesForQuoteToUse);
      } else {
        wickFilteredTradesByQuote.set(quoteMint, tradesForQuote);
      }

      // When filter wicks is on, auto-exclude low-count or low-rank markets.
      if (filterWicksCheckbox?.checked && combinedByMarket.length > 0) {
        if (combinedByMarket.length > 10) {
          // More than 10 pools: include only the top 5 by count, and only if count >= 50.
          const MIN_COUNT_TOP5 = 50;
          const top5 = combinedByMarket.slice(0, 5);
          for (const entry of top5) {
            if (entry.totalCount >= MIN_COUNT_TOP5) excludedMarkets.delete(entry.marketAddress);
          }
          for (const entry of combinedByMarket) {
            const inTop5 = top5.includes(entry);
            if (!inTop5 || entry.totalCount < MIN_COUNT_TOP5) excludedMarkets.add(entry.marketAddress);
          }
        } else if (combinedByMarket.length > 1) {
          // 2–10 pools: exclude if < 10% of max count or count < 10. Single market: exclude nothing.
          const MIN_COUNT = 10;
          const maxCount = Math.max(...combinedByMarket.map((e) => e.totalCount));
          const threshold = maxCount * 0.1;
          for (const entry of combinedByMarket) {
            if (entry.totalCount < threshold || entry.totalCount < MIN_COUNT) excludedMarkets.add(entry.marketAddress);
          }
        }
      }

      combinedByMarket.forEach((entry, idx) => {
        const { marketAddress, totalCount, filteredCount, programAddress, highVal, lowVal, highVsMedianPct, lowVsMedianPct } = entry;
        const mb = marketBounds.get(quoteMint)?.get(marketAddress);
        const subMinPVal = mb?.minPrice;
        const subMaxPVal = mb?.maxPrice;
        const subMinP = subMinPVal != null && Number.isFinite(subMinPVal) ? fmt(subMinPVal) + ' ' + quoteSym : '—';
        const subMaxP = subMaxPVal != null && Number.isFinite(subMaxPVal) ? fmt(subMaxPVal) + ' ' + quoteSym : '—';
        const subHigh = highVal !== -Infinity && Number.isFinite(highVal) ? fmt(highVal) + ' ' + quoteSym : '—';
        const subLow = lowVal !== Infinity && Number.isFinite(lowVal) ? fmt(lowVal) + ' ' + quoteSym : '—';

        const rHigh = rowHighRank.get(marketAddress);
        const rLow = rowLowRank.get(marketAddress);
        let rowClass = '';
        if (rHigh != null) rowClass = `row-high-${rHigh}`;
        else if (rLow != null) rowClass = `row-low-${rLow}`;

        const subTr = document.createElement('tr');
        subTr.className = 'per-quote-market-row' + (rowClass ? ' ' + rowClass : '');
        if (idx >= TOP_VISIBLE) {
          subTr.classList.add('per-quote-row-collapsible');
          if (!perQuoteExpanded) subTr.classList.add('per-quote-row-hidden');
        }
        const isMarketExcluded = excludedMarkets.has(marketAddress);
        const marketLink = `${SOLSCAN_ACCOUNT}${encodeURIComponent(marketAddress)}`;
        const poolTitle = programAddress
          ? (programLabelCache[programAddress] ?? truncate(programAddress, 4, 4))
          : truncate(marketAddress, 4, 4);
        const highR = Number.isFinite(highVsMedianPct) ? Math.round(highVsMedianPct) : null;
        const lowR = Number.isFinite(lowVsMedianPct) ? Math.round(lowVsMedianPct) : null;
        const highPart = highR !== null && highR !== 0 ? `${highR > 0 ? '+' : ''}${highR}%` : '';
        const lowPart = lowR !== null && lowR !== 0 ? `${lowR > 0 ? '+' : ''}${lowR}%` : '';
        const scoreStr =
          highPart && lowPart
            ? `${highPart} / ${lowPart}`
            : highPart || lowPart || '—';
        subTr.innerHTML = `
          <td class="per-quote-market-cell" title="${marketAddress}">
            <label class="per-quote-market-check-wrap">
              <input type="checkbox" class="per-quote-exclude-market" ${!isMarketExcluded ? 'checked' : ''} data-market="${marketAddress}" aria-label="Include market" />
            </label>
            <span class="per-quote-market-indent"></span>
            <a href="${marketLink}" target="_blank" rel="noopener noreferrer" class="per-quote-market-link" title="${marketAddress}">${escapeHtml(poolTitle)}</a>
            <span class="meta">(${isMarketExcluded ? 0 : filteredCount}/${totalCount})</span>
          </td>
          <td class="per-quote-market-status-cell" style="text-align:center"></td>
          <td class="per-quote-wick-cell per-quote-score-cell">${escapeHtml(scoreStr)}</td>
          <td class="per-quote-market-details">${escapeHtml(subHigh)}</td>
          <td class="per-quote-market-details">${escapeHtml(subLow)}</td>
          <td class="per-quote-market-details">${escapeHtml(subMinP)}</td>
          <td class="per-quote-market-details">${escapeHtml(subMaxP)}</td>
        `;
        const subExcludeCb = subTr.querySelector('.per-quote-exclude-market') as HTMLInputElement | null;
        if (subExcludeCb) {
          subExcludeCb.addEventListener('change', () => {
            if (subExcludeCb.checked) {
              excludedMarkets.delete(marketAddress);
              const parentQuote = lastMarketToQuote.get(marketAddress);
              if (parentQuote) excludedQuoteMints.delete(parentQuote);
            } else {
              excludedMarkets.add(marketAddress);
            }
            const meta = subTr.querySelector('.meta');
            if (meta) meta.textContent = subExcludeCb.checked ? `(${filteredCount}/${totalCount})` : `(0/${totalCount})`;
            onLocalFilterChange();
          });
        }
        tbody.appendChild(subTr);
      });
    }
    if (topQuotesForTable.length > TOP_VISIBLE) {
      const buttonRow = document.createElement('tr');
      buttonRow.className = 'per-quote-show-all-row';
      const td = document.createElement('td');
      td.colSpan = 7;
      td.style.textAlign = 'center';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'per-quote-show-all-btn';
      const total = topQuotesForTable.length;
      btn.textContent = perQuoteExpanded ? 'Show less' : `Show all (${total} total)`;
      btn.addEventListener('click', () => {
        perQuoteExpanded = !perQuoteExpanded;
        const collapsible = tbody.querySelectorAll('tr.per-quote-row-collapsible');
        collapsible.forEach((row) => row.classList.toggle('per-quote-row-hidden', !perQuoteExpanded));
        btn.textContent = perQuoteExpanded ? 'Show less' : `Show all (${total} total)`;
      });
      td.appendChild(btn);
      buttonRow.appendChild(td);
      tbody.appendChild(buttonRow);
    }
    perQuoteFiltersContainer.appendChild(table);
  }
}

function renderTokenEmpty(): void {
  tokenLogo.style.display = 'none';
  tokenLogo.src = '';
  tokenLogo.alt = '';
  tokenSymbol.textContent = '—';
  tokenName.textContent = '—';
  tokenMint.textContent = '—';
  tokenDecimals.textContent = '—';
  tokenVerified.textContent = '—';
  tokenCategory.textContent = '—';
  tokenPriceUsd.textContent = '—';
  tokenMarketCapUsd.textContent = '—';
  tokenVolume24hUsd.textContent = '—';
  tokenVolume24hToken.textContent = '—';
  tokenUpdateTime.textContent = '—';
}

function topCounts(items: Array<string | undefined>, n: number): Array<{ key: string; count: number }> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = (it ?? '').trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

async function fetchTokenMeta(mint: string): Promise<void> {
  renderTokenEmpty();
  clearInlineError(tokenError);
  if (!mint) return;

  tokenLoading.hidden = false;
  tokenLoading.setAttribute('aria-hidden', 'false');
  try {
    const res = await fetchWithRetry(`/api/tokens/${encodeURIComponent(mint)}`);
    const body = (await res.json().catch(() => ({}))) as VybeToken & { error?: string };
    if (!res.ok) {
      showInlineError(tokenError, body.error || `Failed (${res.status})`);
      return;
    }

    const symbol = body.symbol?.trim() || '—';
    tokenSymbol.textContent = symbol;
    tokenName.textContent = body.name?.trim() || '—';
    tokenMint.innerHTML = solscanLinkAccount(body.mintAddress || mint, body.mintAddress || mint);
    tokenDecimals.textContent =
      body.decimals != null ? String(body.decimals) : body.decimal != null ? String(body.decimal) : '—';
    tokenVerified.textContent = body.verified === true ? 'Yes' : body.verified === false ? 'No' : '—';
    tokenCategory.textContent = body.category?.trim() || '—';
    tokenPriceUsd.textContent = fmtUsd(body.price);
    tokenMarketCapUsd.textContent = fmtUsd(body.marketCap);
    tokenVolume24hUsd.textContent = fmtUsd(body.usdValueVolume24h);
    tokenVolume24hToken.textContent = fmtMaybeNumber(body.tokenAmountVolume24h, 2) + (symbol !== '—' ? ` ${symbol}` : '');
    tokenUpdateTime.textContent = body.updateTime ? new Date(body.updateTime * 1000).toLocaleString() : '—';

    lastBaseSymbol = symbol !== '—' ? symbol : undefined;

    const nameStr = body.name?.trim() || '—';
    const lastCandle =
      lastCandlesFromApi.length > 0
        ? lastCandlesFromApi[lastCandlesFromApi.length - 1]
        : lastCandlesFromTrades.length > 0
          ? lastCandlesFromTrades[lastCandlesFromTrades.length - 1]
          : null;
    updateCandlesChartOverlay(symbol, nameStr, lastCandle);

    const logo = (body.logoUrl ?? '').trim();
    if (logo) {
      tokenLogo.src = logo;
      tokenLogo.alt = body.name?.trim() || symbol;
      tokenLogo.style.display = 'block';
    }
  } catch (err) {
    showInlineError(tokenError, err instanceof Error ? err.message : String(err));
  } finally {
    tokenLoading.hidden = true;
    tokenLoading.setAttribute('aria-hidden', 'true');
  }
}

function resolutionToSeconds(resolution: string): number {
  switch (resolution) {
    case '1m': return 60;
    case '3m': return 3 * 60;
    case '5m': return 5 * 60;
    case '15m': return 15 * 60;
    case '30m': return 30 * 60;
    case '1h': return 60 * 60;
    case '2h': return 2 * 60 * 60;
    case '3h': return 3 * 60 * 60;
    case '4h': return 4 * 60 * 60;
    case '1d': return 24 * 60 * 60;
    case '1w': return 7 * 24 * 60 * 60;
    case '1mo': return 30 * 24 * 60 * 60;
    case '1y': return 365 * 24 * 60 * 60;
    default: return 60 * 60;
  }
}

async function fetchCandlesFromApi(mint: string, resolution: string): Promise<Candle[]> {
  const limit = Number(limitSelect?.value) || 1000;
  const page = Math.max(0, Math.trunc(Number(pageFromInput?.value || '0')));
  const timeStart = parseUnixSecondsFromDatetimeLocal(timeStartInput?.value ?? '');
  let timeEnd = parseUnixSecondsFromDatetimeLocal(timeEndInput?.value ?? '');
  if (timeEnd == null || timeEnd < 0) timeEnd = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.set('resolution', resolution);
  params.set('limit', String(limit));
  params.set('page', String(page));
  const eliminateGaps = eliminateCloseToOpenGapsCheckbox?.checked !== false;
  params.set('eliminateCloseToOpenGaps', String(eliminateGaps));
  if (timeStart != null && timeStart >= 0) params.set('timeStart', String(timeStart));
  params.set('timeEnd', String(timeEnd));
  const res = await fetchWithRetry(`/api/tokens/${encodeURIComponent(mint)}/candles?${params.toString()}`);
  const body = (await res.json().catch(() => ({}))) as { data?: Array<{ time: number; open: string; high: string; low: string; close: string; volume?: string }> };
  if (!res.ok) {
    const msg = (body as { error?: string }).error || `Failed (${res.status})`;
    throw new Error(msg);
  }
  const raw = Array.isArray(body.data) ? body.data : [];
  const mapped: Candle[] = [];
  for (const c of raw) {
    const time = typeof c.time === 'number' ? c.time : Number(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const volume = c.volume != null ? Number(c.volume) : undefined;
    if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
      continue;
    }
    mapped.push({ time, open, high, low, close, volume });
  }
  mapped.sort((a, b) => a.time - b.time);
  return mapped;
}

async function fetchCandlesFromMarketApi(marketAddress: string, resolution: string): Promise<Candle[]> {
  const limit = Number(limitSelect?.value) || 1000;
  const page = Math.max(0, Math.trunc(Number(pageFromInput?.value || '0')));
  const timeStart = parseUnixSecondsFromDatetimeLocal(timeStartInput?.value ?? '');
  let timeEnd = parseUnixSecondsFromDatetimeLocal(timeEndInput?.value ?? '');
  if (timeEnd == null || timeEnd < 0) timeEnd = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.set('resolution', resolution);
  params.set('limit', String(limit));
  params.set('page', String(page));
  const eliminateGaps = eliminateCloseToOpenGapsCheckbox?.checked !== false;
  params.set('eliminateCloseToOpenGaps', String(eliminateGaps));
  if (timeStart != null && timeStart >= 0) params.set('timeStart', String(timeStart));
  params.set('timeEnd', String(timeEnd));
  const res = await fetchWithRetry(`/api/markets/${encodeURIComponent(marketAddress)}/candles?${params.toString()}`);
  const body = (await res.json().catch(() => ({}))) as { data?: Array<{ time: number; open: string; high: string; low: string; close: string; volume?: string }> };
  if (!res.ok) {
    const msg = (body as { error?: string }).error || `Failed (${res.status})`;
    throw new Error(msg);
  }
  const raw = Array.isArray(body.data) ? body.data : [];
  const mapped: Candle[] = [];
  for (const c of raw) {
    const time = typeof c.time === 'number' ? c.time : Number(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const volume = c.volume != null ? Number(c.volume) : undefined;
    if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
      continue;
    }
    mapped.push({ time, open, high, low, close, volume });
  }
  mapped.sort((a, b) => a.time - b.time);
  return mapped;
}

/**
 * Build OHLC candles from trade history. Uses all filtered trades where the
 * analysed mint is base or quote. Price is normalized to "quote per 1 unit of
 * analysed mint" (so USD-stable quotes show USD price; e.g. SOL quote shows SOL/token).
 */
function buildCandlesFromTrades(trades: VybeTrade[], resolution: string, analysedMint: string): Candle[] {
  if (!trades.length || !analysedMint.trim()) return [];
  const mint = analysedMint.trim();
  const bucketSize = resolutionToSeconds(resolution);
  const byBucket = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();

  const sorted = [...trades]
    .filter((t) => {
      if (typeof t.blockTime !== 'number' || t.price == null) return false;
      const base = (t.baseMintAddress ?? '').trim();
      const quote = (t.quoteMintAddress ?? '').trim();
      const analysedIsBase = base === mint;
      const analysedIsQuote = quote === mint;
      if (!(analysedIsBase || analysedIsQuote) || !base || !quote) return false;
      const otherMint = analysedIsBase ? quote : base;
      return otherMint === getSelectedChartQuoteMint();
    })
    .sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0));

  for (const t of sorted) {
    const bt = t.blockTime!;
    const base = (t.baseMintAddress ?? '').trim();
    const rawPrice = Number(t.price);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue;
    // Normalize: "USD per 1 unit of analysed mint". API price = quote per base.
    const price = base === mint ? rawPrice : 1 / rawPrice;
    const bucket = Math.floor(bt / bucketSize) * bucketSize;
    const quoteSize = Number(t.quoteSize);
    const vol = Number.isFinite(quoteSize) ? quoteSize : 0;
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
  const entries = [...byBucket.entries()]
    .map(([time, v]) => ({ time, open: v.open, high: v.high, low: v.low, close: v.close, volume: v.volume }))
    .sort((a, b) => a.time - b.time);
  return entries;
}

/** Build OHLC candles for a single market (trades filtered by quote mint and market address). */
function buildCandlesFromTradesForMarket(
  trades: VybeTrade[],
  resolution: string,
  analysedMint: string,
  quoteMint: string,
  marketAddress: string
): Candle[] {
  if (!trades.length || !analysedMint.trim() || !marketAddress.trim()) return [];
  const mint = analysedMint.trim();
  const m = marketAddress.trim();
  const bucketSize = resolutionToSeconds(resolution);
  const byBucket = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();

  const sorted = [...trades]
    .filter((t) => {
      if (typeof t.blockTime !== 'number' || t.price == null) return false;
      const base = (t.baseMintAddress ?? '').trim();
      const quote = (t.quoteMintAddress ?? '').trim();
      const analysedIsBase = base === mint;
      const analysedIsQuote = quote === mint;
      if (!(analysedIsBase || analysedIsQuote) || !base || !quote) return false;
      const otherMint = analysedIsBase ? quote : base;
      const tMarket = (t.marketAddress ?? '').trim();
      return otherMint === quoteMint && tMarket === m;
    })
    .sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0));

  for (const t of sorted) {
    const bt = t.blockTime!;
    const base = (t.baseMintAddress ?? '').trim();
    const rawPrice = Number(t.price);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue;
    const price = base === mint ? rawPrice : 1 / rawPrice;
    const bucket = Math.floor(bt / bucketSize) * bucketSize;
    const quoteSize = Number(t.quoteSize);
    const vol = Number.isFinite(quoteSize) ? quoteSize : 0;
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
  return [...byBucket.entries()]
    .map(([time, v]) => ({ time, open: v.open, high: v.high, low: v.low, close: v.close, volume: v.volume }))
    .sort((a, b) => a.time - b.time);
}

function median(sortedArr: number[]): number {
  if (sortedArr.length === 0) return 0;
  const mid = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 === 1) return sortedArr[mid]!;
  return ((sortedArr[mid - 1] ?? 0) + (sortedArr[mid] ?? 0)) / 2;
}

function ensureCandlesChart(): void {
  if (!candlesChartEl) return;
  if (!candlesChart) {
    const width = candlesChartEl.clientWidth || 600;
    const height = candlesChartEl.clientHeight || 650;
    candlesChart = LightweightCharts.createChart(candlesChartEl, {
      width,
      height,
      layout: {
        background: { color: '#0b0b0f' },
        textColor: '#e4e4e7',
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: '#27272a',
      },
    } as any);
    candlesSeries = candlesChart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false,
      priceFormat: {
        type: 'custom',
        minMove: 0.000000001,
        formatter: formatPriceForChart,
      },
    } as any);
    const timeScale = candlesChart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange((range) => {
      if (range === null || candlesBarCount <= 0) return;
      const GAP_BARS = 20;
      const width = range.to - range.from;
      const maxLogical = candlesBarCount - 1 + GAP_BARS;

      // Clamp left: don't scroll past the first candle.
      if (range.from < 0) {
        timeScale.setVisibleLogicalRange({ from: 0, to: width });
        return;
      }

      // Clamp right: allow only a small gap past the newest candle.
      if (range.to > maxLogical) {
        const to = maxLogical;
        const from = Math.max(0, to - width);
        timeScale.setVisibleLogicalRange({ from, to });
      }
    });

    candlesChart.subscribeCrosshairMove((param) => {
      if (!candlesChartOverlay) return;
      const symbol = lastBaseSymbol ?? '—';
      const name = (tokenName && tokenName.textContent) ? tokenName.textContent.trim() : '—';
      let candle: Candle | null = null;
      if (param && param.time != null && candlesSeries && param.seriesData) {
        const data = param.seriesData.get(candlesSeries);
        if (data && (data.open != null || data.close != null)) {
          const found = lastCandlesForTooltip.find((c) => c.time === param.time);
          if (found) {
            candle = {
              ...found,
              open: data.open ?? found.open,
              high: data.high ?? found.high,
              low: data.low ?? found.low,
              close: data.close ?? found.close,
            };
          } else {
            candle = {
              time: param.time as number,
              open: data.open ?? data.close ?? 0,
              high: data.high ?? data.close ?? 0,
              low: data.low ?? data.close ?? 0,
              close: data.close ?? 0,
            };
          }
        }
      }
      updateCandlesChartOverlay(symbol, name, candle);
    });

    window.addEventListener('resize', () => {
      if (!candlesChart || !candlesChartEl) return;
      const w = candlesChartEl.clientWidth || 600;
      const h = candlesChartEl.clientHeight || 650;
      candlesChart.resize(w, h);
    });
  }
}

function renderCandles(candles: Candle[]): void {
  if (!candlesChartEl) return;
  ensureCandlesChart();
  if (!candlesSeries) return;
  candlesBarCount = candles.length;
  lastCandlesForTooltip = candles;
  candlesSeries.setData(
    candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
  );
  if (candlesChart && candlesBarCount > 0) {
    const timeScale = candlesChart.timeScale();
    if (candlesSourceSelect?.value === 'trades') {
      timeScale.fitContent();
    } else {
      const currentRange = timeScale.getVisibleLogicalRange();
      const lastIndex = candlesBarCount - 1;
      const GAP_BARS = 20;
      const defaultWidth = currentRange ? currentRange.to - currentRange.from : Math.min(candlesBarCount, 100);
      const to = lastIndex + GAP_BARS;
      const from = Math.max(0, to - defaultWidth);
      timeScale.setVisibleLogicalRange({ from, to });
    }
  }

  updateCandlesChartOverlay(
    lastBaseSymbol ?? '—',
    (tokenName && tokenName.textContent) ? tokenName.textContent.trim() : '—',
    candles.length > 0 ? candles[candles.length - 1] : null
  );
}

function updateCandlesChartOverlay(symbol: string, name: string, lastCandle: Candle | null): void {
  if (!candlesChartOverlay) return;
  const titleText = symbol === name ? name : `${name} (${symbol})`;
  let html = `<div class="overlay-symbol">${escapeHtml(titleText)}</div>`;
  if (lastCandle) {
    const o = formatPriceForChart(lastCandle.open);
    const h = formatPriceForChart(lastCandle.high);
    const l = formatPriceForChart(lastCandle.low);
    const c = formatPriceForChart(lastCandle.close);
    const padded = padOhlcToSameLength(o, h, l, c);
    html += `<div class="overlay-ohlc">
      <span>Open</span><span>${padded.open}</span>
      <span>High</span><span>${padded.high}</span>
      <span>Low</span><span>${padded.low}</span>
      <span>Close</span><span>${padded.close}</span>
      <span>Time</span><span>${escapeHtml(formatTimeOnly(lastCandle.time))}</span>
      <span>Date</span><span>${escapeHtml(formatDateYY(lastCandle.time))}</span>
    </div>`;
    if (lastCandle.volume != null && Number.isFinite(lastCandle.volume)) {
      const volStr = formatVolumeWithSymbol(lastCandle.volume, symbol !== '—' ? symbol : 'USD');
      html += `<div class="overlay-volume"><span>Volume</span><span>${escapeHtml(volStr)}</span></div>`;
    } else {
      html += `<div class="overlay-volume"><span>Volume</span><span>—</span></div>`;
    }
  } else {
    html += `<div class="overlay-ohlc">
      <span>Open</span><span>—</span>
      <span>High</span><span>—</span>
      <span>Low</span><span>—</span>
      <span>Close</span><span>—</span>
      <span>Time</span><span>—</span>
      <span>Date</span><span>—</span>
    </div>`;
    html += `<div class="overlay-volume"><span>Volume</span><span>—</span></div>`;
  }
  candlesChartOverlay.innerHTML = html;
}

/**
 * Refresh the candlestick chart. When rebuilding from trades, pass the exact
 * filtered trades snapshot to use so the chart reflects the current filters
 * even if lastFilteredTrades changes before the async call runs.
 */
async function refreshCandles(tradesSnapshot?: VybeTrade[]): Promise<void> {
  if (!userHasClickedFetchCandles) return;
  if (!candlesResolutionSelect || !candlesChartEl) return;
  const mint = mintAddressInput.value.trim();
  if (!mint) return;
  const resolution = candlesResolutionSelect.value || '1m';
  const source = candlesSourceSelect?.value ?? 'full';
  const useTrades = source === 'trades';
  const useMarket = source === 'market';
  if (candlesError) {
    candlesError.textContent = '';
    candlesError.hidden = true;
    candlesError.setAttribute('aria-hidden', 'true');
  }
  if (candlesLoading) {
    candlesLoading.hidden = false;
    candlesLoading.setAttribute('aria-hidden', 'false');
  }
  try {
    let candles: Candle[];
    if (useTrades) {
      let tradesToUse: VybeTrade[];
      if (filterWicksCheckbox?.checked) {
        const chartQuote = getSelectedChartQuoteMint();
        const filtered = chartQuote ? wickFilteredTradesByQuote.get(chartQuote) : undefined;
        tradesToUse = filtered ?? (tradesSnapshot ?? lastFilteredTrades);
      } else {
        tradesToUse = tradesSnapshot ?? lastFilteredTrades;
      }
      const chartQuote = getSelectedChartQuoteMint();
      if (chartQuote) tradesToUse = tradesToUse.filter((t) => otherMint(t, mint) === chartQuote);
      candles = buildCandlesFromTrades(tradesToUse, resolution, mint);
      if (eliminateCloseToOpenGapsCheckbox?.checked && candles.length > 0) {
        for (let i = 1; i < candles.length; i++) candles[i].open = candles[i - 1].close;
      }
      lastCandlesFromTrades = candles;
      if (candles.length === 0 && candlesError) {
        candlesError.textContent = 'No data for current filters. Include at least one quote (and its markets) to see the chart.';
        candlesError.hidden = false;
        candlesError.removeAttribute('aria-hidden');
      }
    } else if (useMarket) {
      const marketAddress = candlesMarketAddressInput?.value.trim() ?? '';
      if (!marketAddress) {
        if (candlesError) {
          candlesError.textContent = 'Enter a market address for Vybe OHLC by Market API.';
          candlesError.hidden = false;
          candlesError.removeAttribute('aria-hidden');
        }
        candles = [];
      } else {
        candles = await fetchCandlesFromMarketApi(marketAddress, resolution);
        lastCandlesFromApi = candles;
      }
    } else {
      candles = await fetchCandlesFromApi(mint, resolution);
      lastCandlesFromApi = candles;
    }
    renderCandles(candles);
  } catch (err) {
    if (candlesError) {
      const msg = err instanceof Error ? err.message : String(err);
      candlesError.textContent = msg;
      candlesError.hidden = false;
      candlesError.removeAttribute('aria-hidden');
    }
  } finally {
    if (candlesLoading) {
      candlesLoading.hidden = true;
      candlesLoading.setAttribute('aria-hidden', 'true');
    }
  }
}

async function fetchSymbol(mint: string): Promise<string | undefined> {
  const hardcoded = HARDCODED_QUOTE_MINTS[mint];
  if (hardcoded) {
    quoteSymbolCache[mint] = hardcoded;
    return hardcoded;
  }
  if (quoteSymbolCache[mint]) return quoteSymbolCache[mint];
  const res = await fetchWithRetry(`/api/token-symbol/${encodeURIComponent(mint)}`);
  const body = (await res.json().catch(() => ({}))) as TokenSymbolResponse;
  if (!res.ok) return undefined;
  const s = (body.symbol ?? '').trim();
  if (!s || s === mint) return undefined;
  quoteSymbolCache[mint] = s;
  return s;
}

/** Each row has baseMintAddress and quoteMintAddress. Use the one that isn't the mint being analysed. */
function otherMint(t: VybeTrade, mintBeingAnalysed: string): string {
  const base = (t.baseMintAddress ?? '').trim();
  const quote = (t.quoteMintAddress ?? '').trim();
  return base === mintBeingAnalysed ? quote : base;
}

async function ensureQuoteSymbols(trades: VybeTrade[], baseMint: string): Promise<void> {
  const unique = new Set<string>();
  for (const t of trades.slice(0, 250)) {
    const m = otherMint(t, baseMint).trim();
    if (!m || m === baseMint) continue;
    if (quoteSymbolCache[m]) continue;
    unique.add(m);
    if (unique.size >= 12) break;
  }
  for (const m of unique) {
    const s = await fetchSymbol(m);
    if (s) quoteSymbolCache[m] = s;
  }
}

/** Ensure symbol cache has base and quote mints for trades (for table input/output columns). */
async function ensureSymbolsForTrades(trades: VybeTrade[]): Promise<void> {
  const unique = new Set<string>();
  for (const t of trades.slice(0, 500)) {
    const b = (t.baseMintAddress ?? '').trim();
    const q = (t.quoteMintAddress ?? '').trim();
    if (b) unique.add(b);
    if (q) unique.add(q);
    if (unique.size >= 50) break;
  }
  for (const m of unique) {
    if (quoteSymbolCache[m]) continue;
    const s = await fetchSymbol(m);
    if (s) quoteSymbolCache[m] = s;
  }
}

/** Ensure program label cache has labels for programs in trades (for table program column). */
async function ensureProgramLabels(trades: VybeTrade[]): Promise<void> {
  const unique = new Set<string>();
  for (const t of trades.slice(0, 500)) {
    const p = (t.programAddress ?? '').trim();
    if (p) unique.add(p);
    if (unique.size >= 30) break;
  }
  for (const addr of unique) {
    if (programLabelCache[addr]) continue;
    programLabelCache[addr] = WELL_KNOWN_PROGRAMS[addr] ?? addr;
  }
  const needLabel = [...unique].filter((addr) => programLabelCache[addr] === addr);
  if (needLabel.length === 0) return;
  try {
    const r = await fetchWithRetry('/api/programs/labeled-program-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programAddresses: needLabel }),
    });
    if (r.ok) {
      const body = (await r.json().catch(() => ({}))) as { labels?: Record<string, string> };
      const labels = body.labels ?? {};
      Object.assign(programLabelCache, labels);
    }
  } catch {
    // keep WELL_KNOWN or address fallback
  }
}

/** Program column: first word only, or first + second word if second is all CAPS and 4–5 chars (e.g. CLMM, CPMM). */
function programDisplayLabel(addr: string | undefined): string {
  if (!addr) return '—';
  const label = programLabelCache[addr] ?? WELL_KNOWN_PROGRAMS[addr] ?? addr;
  if (!label || label === addr) return truncate(addr, 5, 4);
  const words = label.trim().split(/\s+/);
  const first = words[0] ?? '';
  const second = words[1];
  if (second && /^[A-Z]+$/.test(second) && second.length >= 4 && second.length <= 5) {
    return `${first} ${second}`;
  }
  return first;
}

function updateTradesSummary(trades: VybeTrade[], meta: { remoteCount: number; filteredCount: number }): void {
  if (!tradesSummaryEl) return;
  if (tradesSummaryCountEl) {
    const filtered = meta.filteredCount ?? trades.length;
    tradesSummaryCountEl.textContent = filtered.toLocaleString();
  }
  if (trades.length === 0) {
    if (tradesSummaryProgramsEl) tradesSummaryProgramsEl.textContent = '0';
    if (tradesSummaryMarketsEl) tradesSummaryMarketsEl.textContent = '0';
    if (tradesSummaryQuotesEl) tradesSummaryQuotesEl.textContent = '0';
    if (tradesSummaryTimeEl) tradesSummaryTimeEl.textContent = '—';
    return;
  }

  const programs = new Set<string>();
  const markets = new Set<string>();
  const analysedMint = mintAddressInput.value.trim();
  const marketToQuoteMint = new Map<string, string>();
  let minTime: number | undefined;
  let maxTime: number | undefined;
  for (const t of trades) {
    const p = (t.programAddress ?? '').trim();
    const m = (t.marketAddress ?? '').trim();
    if (p) programs.add(p);
    if (m) markets.add(m);
    if (m) {
      const quoteMint = (t.quoteMintAddress ?? '').trim();
      if (quoteMint) marketToQuoteMint.set(m, quoteMint);
    }
    const bt = t.blockTime;
    if (typeof bt === 'number' && Number.isFinite(bt)) {
      minTime = minTime == null ? bt : Math.min(minTime, bt);
      maxTime = maxTime == null ? bt : Math.max(maxTime, bt);
    }
  }

  const quoteMintsFromMarkets = new Set(
    [...marketToQuoteMint.values()].filter((mint) => mint !== analysedMint)
  );
  if (tradesSummaryProgramsEl) tradesSummaryProgramsEl.textContent = programs.size.toLocaleString();
  if (tradesSummaryMarketsEl) tradesSummaryMarketsEl.textContent = markets.size.toLocaleString();
  if (tradesSummaryQuotesEl) tradesSummaryQuotesEl.textContent = quoteMintsFromMarkets.size.toLocaleString();
  if (tradesSummaryTimeEl) {
    if (minTime != null && maxTime != null && minTime !== maxTime) {
      tradesSummaryTimeEl.textContent = `${formatTime(minTime)} → ${formatTime(maxTime)}`;
    } else if (minTime != null) {
      tradesSummaryTimeEl.textContent = formatTime(minTime);
    } else {
      tradesSummaryTimeEl.textContent = '—';
    }
  }
}

function renderTrades(trades: VybeTrade[], meta: { remoteCount: number; filteredCount: number; query: string }): void {
  tradesMeta.textContent = '';
  updateTradesSummary(trades, meta);

  tradesBody.innerHTML = trades.length
    ? trades
        .map((t) => {
          const time = formatTime(t.blockTime);
          const inputSym = quoteSymOrTrunc(t.baseMintAddress);
          const outputSym = quoteSymOrTrunc(t.quoteMintAddress);
          const analysedMint = mintAddressInput.value.trim();
          const baseMint = (t.baseMintAddress ?? '').trim();
          const quoteMint = (t.quoteMintAddress ?? '').trim();

          const priceN = Number(t.price);
          let priceRaw: string;
          let priceSym: string;
          if (!Number.isFinite(priceN)) {
            priceRaw = '—';
            priceSym = '';
          } else if (analysedMint && quoteMint === analysedMint) {
            const inv = 1 / priceN;
            priceSym = isStableQuoteSymbol(inputSym) ? inputSym : displaySymbol(inputSym);
            const priceSymD = symbolMax5(priceSym);
            priceRaw = isStableQuoteSymbol(inputSym)
              ? `${fmtUsd(inv)} ${priceSymD}`
              : `${fmtPriceAmount(inv)} ${priceSymD}`;
          } else {
            priceSym = isStableQuoteSymbol(outputSym) ? outputSym : displaySymbol(outputSym);
            const priceSymD = symbolMax5(priceSym);
            priceRaw = isStableQuoteSymbol(outputSym)
              ? `${fmtUsd(priceN)} ${priceSymD}`
              : `${fmtPriceAmount(priceN)} ${priceSymD}`;
          }
          const priceIsAnalysedMint = !analysedMint;
          const price = priceSym ? wrapAmountClass(priceRaw, priceSym, priceIsAnalysedMint) : priceRaw;

          const type = !analysedMint ? '—' : baseMint === analysedMint ? 'Sell' : quoteMint === analysedMint ? 'Buy' : '—';

          const inputSymD = symbolMax5(displaySymbol(inputSym));
          const inputAmountRaw = t.baseSize != null ? `${fmtTokenAmount(t.baseSize)} ${inputSymD}` : '—';
          const inputIsAnalysedMint = !analysedMint || baseMint === analysedMint;
          const inputAmount = wrapAmountClass(inputAmountRaw, inputSym, inputIsAnalysedMint);
          const outputSizeN = Number(t.quoteSize);
          const outputSymD = symbolMax5(displaySymbol(outputSym));
          const outputAmountRaw = t.quoteSize != null
            ? isStableQuoteSymbol(outputSym) && Number.isFinite(outputSizeN)
              ? `${fmtUsd(outputSizeN)} ${outputSymD}`
              : `${fmtTokenAmount(t.quoteSize)} ${outputSymD}`
            : '—';
          const outputIsAnalysedMint = !analysedMint || quoteMint === analysedMint;
          const outputAmount = wrapAmountClass(outputAmountRaw, outputSym, outputIsAnalysedMint);

          const otherSymbol =
            analysedMint && (baseMint === analysedMint || quoteMint === analysedMint)
              ? baseMint === analysedMint
                ? outputSymD
                : inputSymD
              : `${inputSymD}/${outputSymD}`;
          const otherSymRaw =
            analysedMint && (baseMint === analysedMint || quoteMint === analysedMint)
              ? baseMint === analysedMint
                ? outputSym
                : inputSym
              : '';
          const marketOtherClass =
            otherSymRaw
              ? isStableQuoteSymbol(otherSymRaw)
                ? 'amount-usdc'
                : displaySymbol(otherSymRaw) === 'SOL'
                  ? 'amount-sol'
                  : 'market-other-yellow'
              : '';
          const marketOtherPart =
            marketOtherClass ? `<span class="${marketOtherClass}">(${otherSymbol})</span>` : `(${otherSymbol})`;
          const market = t.marketAddress
            ? `<a href="${SOLSCAN_ACCOUNT}${encodeURIComponent(t.marketAddress)}" target="_blank" rel="noopener noreferrer" title="${t.marketAddress}">${truncate(t.marketAddress, 4, 4)} ${marketOtherPart}</a>`
            : '—';
          const program = t.programAddress
            ? `<a href="${SOLSCAN_ACCOUNT}${encodeURIComponent(t.programAddress)}" target="_blank" rel="noopener noreferrer" title="${t.programAddress}">${programDisplayLabel(t.programAddress)}</a>`
            : '—';
          const authority = (t.authorityAddress ?? '').trim();
          const feePayer = (t.feePayerAddress ?? '').trim();
          const feePayerLink = feePayer
            ? `<span class="fee-payer-cell">(${vybeLinkAccount(feePayer, truncate(feePayer, 4, 4))})</span>`
            : '';
          const hasTwoValues = !!(authority && feePayer && authority !== feePayer);
          const authorityFeePayerCellClass = hasTwoValues ? 'authority-fee-payer-double' : 'authority-fee-payer-single';
          const authorityFeePayer =
            !authority && !feePayer
              ? '—'
              : authority === feePayer
                ? vybeLinkAccount(authority || undefined, truncate(authority || undefined, 4, 4))
                : authority && feePayer
                  ? `${vybeLinkAccount(authority, truncate(authority, 4, 4))}<br>${feePayerLink}`
                  : authority
                    ? vybeLinkAccount(authority, truncate(authority, 4, 4))
                    : feePayer
                      ? feePayerLink
                      : '—';
          const txid = t.signature
            ? `<a href="${SOLSCAN_TX}${encodeURIComponent(t.signature)}" target="_blank" rel="noopener noreferrer" title="${t.signature}" class="txid-icon" aria-label="View transaction">↗</a>`
            : '—';

          return `<tr>
            <td>${time}</td>
            <td style="text-align:center">${type}</td>
            <td style="text-align:right">${price}</td>
            <td style="text-align:right">${inputAmount}</td>
            <td style="text-align:right">${outputAmount}</td>
            <td>${market}</td>
            <td>${program}</td>
            <td class="${authorityFeePayerCellClass}">${authorityFeePayer}</td>
            <td style="text-align:center">${txid}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>';
}

function toCsv(trades: VybeTrade[]): string {
  const header = [
    'blockTime',
    'price',
    'baseSize',
    'quoteSize',
    'baseMintAddress',
    'quoteMintAddress',
    'marketAddress',
    'programAddress',
    'authorityAddress',
    'feePayerAddress',
    'signature',
  ];
  const rows = trades.map((t) =>
    [
      t.blockTime ?? '',
      t.price ?? '',
      t.baseSize ?? '',
      t.quoteSize ?? '',
      t.baseMintAddress ?? '',
      t.quoteMintAddress ?? '',
      t.marketAddress ?? '',
      t.programAddress ?? '',
      t.authorityAddress ?? '',
      t.feePayerAddress ?? '',
      t.signature ?? '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function onFetch(): Promise<void> {
  clearError();
  clearInlineError(tokenError);
  // Clear tables immediately so the user sees we're refetching.
  renderTrades([], { remoteCount: 0, filteredCount: 0, query: '' });
  perQuoteFiltersContainer.innerHTML = '';
  // Reset per-quote state for new fetch.
  lastRemoteTrades = [];
  lastFilteredTrades = [];
  lastFilteredTradesForPerQuote = [];
  wickFilteredTradesByQuote.clear();
  excludedQuoteMints.clear();
  excludedMarkets.clear();
  Object.keys(perQuoteRules).forEach((k) => {
    delete perQuoteRules[k];
  });
  userHasClickedFetchCandles = true;
  fetchBtn.disabled = true;
  exportBtn.disabled = true;
  exportAllBtn.disabled = true;
  loadingIndicator.hidden = false;
  loadingIndicator.setAttribute('aria-hidden', 'false');
  tradesLoading.hidden = false;
  tradesLoading.setAttribute('aria-hidden', 'false');

  try {
    // Reset UI back to empty placeholders before fetching.
    renderTokenEmpty();

    const mint = mintAddressInput.value.trim();

    // Fetch symbol for the mint first so the trades table can show it in Input/Output mint columns.
    if (mint) await fetchSymbol(mint);

    // Fire-and-forget token metadata (name, price, etc.); should not block trades table.
    void fetchTokenMeta(mint);

    const candlesSource = candlesSourceSelect?.value ?? 'full';
    const useRebuildCandles = candlesSource === 'trades';

    // When using Vybe OHLC (full or market), fetch and show candles first so the chart appears immediately.
    const fetchedCandlesAtStart =
      candlesResolutionSelect &&
      candlesChartEl &&
      ((candlesSource === 'full' && !!mint) || (candlesSource === 'market' && !!candlesMarketAddressInput?.value.trim()));
    if (fetchedCandlesAtStart) {
      await refreshCandles();
    }

    const pageFrom = parseIntOrUndefined(pageFromInput.value) ?? 0;
    const N =
      candlesSource === 'full' || candlesSource === 'market'
        ? 1
        : Math.min(20, Math.max(1, parseInt(String(candlesPagesInput?.value), 10) || 10));
    const pages = Array.from({ length: N }, (_, i) => pageFrom + i);

    let allTrades: VybeTrade[] = [];
    for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const progressStr =
          allTrades.length > 0
            ? `Page ${i + 1}/${pages.length} · ${allTrades.length.toLocaleString()} records`
            : `Page ${i + 1}/${pages.length} · fetching…`;
        if (candlesPagesProgress) candlesPagesProgress.textContent = progressStr;
        if (tradesLoadingText) tradesLoadingText.textContent = progressStr;
        const query = buildTradesQueryForTable(p);
        const url = `/api/trades?${query}`;
        const res = await fetchWithRetry(url);
        const body = (await res.json().catch(() => ({}))) as TradesResponse & { error?: string };
        if (!res.ok) {
          showError(body.error || `Failed (${res.status})`);
          lastRemoteTrades = [];
          lastFilteredTrades = [];
          renderTrades([], { remoteCount: 0, filteredCount: 0, query: '' });
          return;
        }
        const chunk = Array.isArray(body.data) ? body.data : [];
        allTrades.push(...chunk);
        if (chunk.length < 950) break;

        // Update table and UI after each page so trades appear as they arrive (all modes).
        if (allTrades.length > 0) {
          lastRemoteTrades = [...allTrades];
          const remoteForDisplay = getRemoteTradesForDisplay();
          lastFilteredTrades = applyLocalFilters(remoteForDisplay);
          lastFilteredTradesForPerQuote = applyLocalFiltersWithoutPerQuoteRules(remoteForDisplay);
          const pageIndex = i + 1;
          const pageProgressStr = `Page ${pageIndex}/${pages.length} · ${allTrades.length.toLocaleString()} records`;
          if (candlesPagesProgress) candlesPagesProgress.textContent = pageProgressStr;
          if (tradesLoadingText) tradesLoadingText.textContent = pageProgressStr;
          const tableTrades = getTradesForTableDisplay();
          renderTrades(tableTrades, {
            remoteCount: remoteForDisplay.length,
            filteredCount: tableTrades.length,
            query: pages.length > 1 ? `pages ${pageFrom}..${p}` : `page ${p}`,
          });
          exportBtn.disabled = tableTrades.length === 0;
          exportAllBtn.disabled = remoteForDisplay.length === 0;
          if (useRebuildCandles) {
            if (chartQuotesWrap && !chartQuotesWrap.hidden && chartQuoteSelect) {
              buildChartQuotesRadios();
            }
            // Build per-quote rows (and wick-filtered data) using current chart quote selection so first fetch applies filter.
            buildLocalFilterRows();
            if (candlesResolutionSelect && candlesChartEl) void refreshCandles(lastFilteredTrades);
          }
        }
    }

    lastRemoteTrades = allTrades;
    const fullRemoteForDisplay = getRemoteTradesForDisplay();
    lastFilteredTrades = applyLocalFilters(fullRemoteForDisplay);
    lastFilteredTradesForPerQuote = applyLocalFiltersWithoutPerQuoteRules(fullRemoteForDisplay);
    await ensureQuoteSymbols(lastFilteredTrades, mintAddressInput.value.trim());
    await ensureSymbolsForTrades(lastFilteredTrades);
    await ensureProgramLabels(lastFilteredTrades);
    const tableTrades = getTradesForTableDisplay();
    renderTrades(tableTrades, {
      remoteCount: fullRemoteForDisplay.length,
      filteredCount: tableTrades.length,
      query: pages.length > 1 ? `pages=${pages[0]}..${pages[pages.length - 1]}` : `page=${pages[0]}`,
    });
    exportBtn.disabled = tableTrades.length === 0;
    exportAllBtn.disabled = lastRemoteTrades.length === 0;
    if (chartQuotesWrap && !chartQuotesWrap.hidden && chartQuoteSelect) {
      buildChartQuotesRadios();
    }
    buildLocalFilterRows(fullRemoteForDisplay);
    // Refresh chart: for trades mode use final wick-filtered data; for full/market only if we didn't fetch candles in the loop.
    if (candlesSourceSelect?.value === 'trades' && candlesResolutionSelect && candlesChartEl) {
      void refreshCandles();
    } else if (!fetchedCandlesAtStart && candlesResolutionSelect && candlesChartEl) {
      void refreshCandles();
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
  } finally {
    if (candlesPagesProgress) candlesPagesProgress.textContent = '';
    if (tradesLoadingText) tradesLoadingText.textContent = 'Loading…';
    fetchBtn.disabled = false;
    loadingIndicator.hidden = true;
    loadingIndicator.setAttribute('aria-hidden', 'true');
    tradesLoading.hidden = true;
    tradesLoading.setAttribute('aria-hidden', 'true');
  }
}

function onLocalFilterChange(): void {
  const remoteForDisplay = getRemoteTradesForDisplay();
  lastFilteredTrades = applyLocalFilters(remoteForDisplay);
  lastFilteredTradesForPerQuote = applyLocalFiltersWithoutPerQuoteRules(remoteForDisplay);
  if (candlesSourceSelect?.value === 'trades' && candlesChartEl && candlesResolutionSelect) {
    if (candlesLoading) {
      candlesLoading.hidden = false;
      candlesLoading.setAttribute('aria-hidden', 'false');
    }
    void refreshCandles(lastFilteredTrades);
  }
  const tableTrades = getTradesForTableDisplay();
  renderTrades(tableTrades, {
    remoteCount: remoteForDisplay.length,
    filteredCount: tableTrades.length,
    query: '',
  });
  exportBtn.disabled = tableTrades.length === 0;
  buildLocalFilterRows();
  if (candlesSourceSelect?.value === 'trades' && filterWicksCheckbox?.checked && candlesChartEl) {
    void refreshCandles(lastFilteredTrades);
  }
  if (chartQuotesWrap && !chartQuotesWrap.hidden && chartQuoteSelect) {
    buildChartQuotesRadios();
  }
}

fetchBtn.addEventListener('click', () => {
  if (!fetchClickedOnce) {
    fetchClickedOnce = true;
    fetchBtn.classList.remove('fetch-btn-attention');
  }
  void onFetch();
});

exportBtn.addEventListener('click', () => {
  const page = Math.max(0, Math.trunc(Number(pageFromInput.value || '0')));
  const csv = toCsv(getTradesForTableDisplay());
  downloadCsv(`trades-page-${page}.csv`, csv);
});

exportAllBtn.addEventListener('click', async () => {
  clearError();
  exportAllBtn.disabled = true;
  loadingIndicator.hidden = false;
  loadingIndicator.setAttribute('aria-hidden', 'false');
  tradesLoading.hidden = false;
  tradesLoading.setAttribute('aria-hidden', 'false');

  try {
    const query = buildTradesQueryForTable();
    const limit = Number(limitSelect.value) || 1000;
    const maxPages = Math.max(1, Math.trunc(Number(maxPagesInput?.value || '50')));

    // Export pulls pages starting from pageFrom.
    const startPage = Math.max(0, Math.trunc(Number(pageFromInput.value || '0')));
    const all: VybeTrade[] = [];

    for (let i = 0; i < maxPages; i++) {
      const page = startPage + i;
      const qs = new URLSearchParams(query);
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      const res = await fetchWithRetry(`/api/trades?${qs.toString()}`);
      const body = (await res.json().catch(() => ({}))) as TradesResponse & { error?: string };
      if (!res.ok) throw new Error(body.error || `Failed (${res.status})`);

      const chunk = Array.isArray(body.data) ? body.data : [];
      all.push(...chunk);

      // Done when a page returns fewer than limit.
      if (chunk.length < limit) break;
    }

    const filtered = applyLocalFilters(all);
    const csv = toCsv(filtered);
    downloadCsv(`trades-export-${startPage}-pages.csv`, csv);
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
  } finally {
    loadingIndicator.hidden = true;
    loadingIndicator.setAttribute('aria-hidden', 'true');
    tradesLoading.hidden = true;
    tradesLoading.setAttribute('aria-hidden', 'true');
    exportAllBtn.disabled = lastRemoteTrades.length === 0;
  }
});

if (localProgramInput) localProgramInput.addEventListener('input', onLocalFilterChange);
if (localSignatureInput) localSignatureInput.addEventListener('input', onLocalFilterChange);
if (localFeePayerInput) localFeePayerInput.addEventListener('input', onLocalFilterChange);
if (localAuthorityInput) localAuthorityInput.addEventListener('input', onLocalFilterChange);
if (authorityEqualsFeePayerCheckbox) authorityEqualsFeePayerCheckbox.addEventListener('change', onLocalFilterChange);
if (filterWicksCheckbox) filterWicksCheckbox.addEventListener('change', onLocalFilterChange);
if (wickLookbackInput) {
  wickLookbackInput.addEventListener('change', onLocalFilterChange);
  wickLookbackInput.addEventListener('input', onLocalFilterChange);
}
if (wickDeviationPctInput) {
  wickDeviationPctInput.addEventListener('change', onLocalFilterChange);
  wickDeviationPctInput.addEventListener('input', onLocalFilterChange);
}
if (eliminateCloseToOpenGapsCheckbox) {
  eliminateCloseToOpenGapsCheckbox.addEventListener('change', () => {
    if (candlesSourceSelect?.value === 'trades' && candlesChartEl) void refreshCandles(lastFilteredTrades);
  });
}

/** Sync switch track aria-pressed from checkbox state */
function syncSwitchTrack(switchLabel: HTMLElement): void {
  const input = switchLabel.querySelector('.trades-fetch-switch-input') as HTMLInputElement | null;
  const options = switchLabel.querySelectorAll('.trades-fetch-switch-option');
  if (!input || !options.length) return;
  const isOn = input.checked;
  options.forEach((opt) => {
    const val = opt.getAttribute('data-value');
    opt.setAttribute('aria-pressed', String(val === 'on' ? isOn : !isOn));
  });
}

/** Wire up trades-fetch-switch: option clicks update checkbox and sync track */
function initLocalFilterSwitches(): void {
  document.querySelectorAll('.trades-fetch-switch').forEach((label) => {
    const switchLabel = label as HTMLElement;
    const input = switchLabel.querySelector('.trades-fetch-switch-input') as HTMLInputElement | null;
    const options = switchLabel.querySelectorAll('.trades-fetch-switch-option');
    if (!input || !options.length) return;
    syncSwitchTrack(switchLabel);
    options.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.preventDefault();
        const val = (opt as HTMLElement).getAttribute('data-value');
        input.checked = val === 'on';
        syncSwitchTrack(switchLabel);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });
}
initLocalFilterSwitches();

if (candlesResolutionSelect) {
  candlesResolutionSelect.addEventListener('change', () => {
    void refreshCandles();
  });
}

function updateCandlesPagesVisibility(): void {
  const source = candlesSourceSelect?.value ?? 'full';
  const showTradesParams = source === 'trades';
  const showMarketAddress = source === 'market';
  if (candlesPagesWrap) candlesPagesWrap.hidden = !showTradesParams;
  if (chartQuotesWrap) chartQuotesWrap.hidden = !showTradesParams;
  if (perQuoteSectionEl) {
    perQuoteSectionEl.hidden = !showTradesParams;
    perQuoteSectionEl.setAttribute('aria-hidden', String(showTradesParams ? 'false' : 'true'));
  }
  if (candlesMarketAddressWrap) candlesMarketAddressWrap.hidden = !showMarketAddress;
}

/** All quote mints in filtered trades with counts, sorted by count desc. Used for chart quote dropdowns. */
function getChartQuoteOptionsWithCounts(): { mint: string; label: string; count: number }[] {
  const baseMint = mintAddressInput.value.trim();
  const counts = new Map<string, number>();
  for (const t of lastFilteredTrades) {
    const q = otherMint(t, baseMint).trim();
    if (q && q !== baseMint) counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  const list = [...counts.entries()]
    .map(([mint, count]) => {
      let label =
        CHART_QUOTE_OPTIONS.find((o) => o.mint === mint)?.label ?? quoteSymOrTrunc(mint);
      if (!label || label === '—') label = truncate(mint, 4, 4);
      return { mint, label, count };
    })
    .sort((a, b) => b.count - a.count);
  return list;
}

function buildChartQuotesRadios(): void {
  if (!chartQuoteSelect) return;
  let quoteOptions = getChartQuoteOptionsWithCounts();
  if (quoteOptions.length === 0) {
    quoteOptions = CHART_QUOTE_OPTIONS.map((o) => ({ mint: o.mint, label: o.label, count: 0 }));
  }
  const currentValue = chartQuoteSelect.value || getSelectedChartQuoteMint();
  chartQuoteSelect.innerHTML = '';
  for (const o of quoteOptions) {
    const opt = document.createElement('option');
    opt.value = o.mint;
    opt.textContent = `${o.label} (${o.count})`;
    if (o.mint === currentValue) opt.selected = true;
    chartQuoteSelect.appendChild(opt);
  }
  if (chartQuoteSelect.value !== currentValue && quoteOptions.length > 0) {
    chartQuoteSelect.value = quoteOptions[0]!.mint;
  }
}

// Apply candles source from URL so refresh loads with the selected option
const urlCandlesSource = new URLSearchParams(window.location.search).get('candlesSource');
if (candlesSourceSelect && (urlCandlesSource === 'full' || urlCandlesSource === 'trades' || urlCandlesSource === 'market')) {
  candlesSourceSelect.value = urlCandlesSource;
}

if (candlesSourceSelect && candlesResolutionSelect) {
  candlesSourceSelect.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('candlesSource', candlesSourceSelect.value);
    window.location.href = url.toString();
  });
}

function updateFetchButtonLabel(): void {
  if (!fetchBtn) return;
  fetchBtn.textContent = candlesSourceSelect?.value === 'trades' ? 'Fetch Trades for Candles' : 'Fetch Candles';
}
if (candlesPagesWrap) {
  candlesPagesWrap.hidden = candlesSourceSelect?.value !== 'trades';
}
if (chartQuotesWrap) {
  chartQuotesWrap.hidden = candlesSourceSelect?.value !== 'trades';
}
if (perQuoteSectionEl) {
  const showParams = candlesSourceSelect?.value === 'trades';
  perQuoteSectionEl.hidden = !showParams;
  perQuoteSectionEl.setAttribute('aria-hidden', showParams ? 'false' : 'true');
  if (showParams) buildLocalFilterRows();
}
function moveNoGapsSwitchToRebuildSection(): void {
  if (!noGapsSwitchWrap || !localNoGapsTarget || !remoteNoGapsTarget) return;
  const isTrades = candlesSourceSelect?.value === 'trades';
  const target = isTrades ? localNoGapsTarget : remoteNoGapsTarget;
  if (noGapsSwitchWrap.parentElement !== target) target.appendChild(noGapsSwitchWrap);
}
moveNoGapsSwitchToRebuildSection();
if (candlesMarketAddressWrap) {
  candlesMarketAddressWrap.hidden = candlesSourceSelect?.value !== 'market';
}
buildChartQuotesRadios();
if (chartQuoteSelect) {
  chartQuoteSelect.addEventListener('change', () => {
    onLocalFilterChange();
    if (candlesSourceSelect?.value === 'trades' && candlesChartEl && candlesResolutionSelect) {
      void refreshCandles(lastFilteredTrades);
    }
  });
}

// Initial empty state
renderTrades([], { remoteCount: 0, filteredCount: 0, query: '' });
renderTokenEmpty();
clearError();
updateFetchButtonLabel();

