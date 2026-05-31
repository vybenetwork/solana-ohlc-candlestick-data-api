/** Token stats grid render helpers (from solana-token-stats-metadata-api). */

interface TokenData {
  symbol?: string;
  name?: string;
  mintAddress?: string;
  logoUrl?: string;
  decimal?: number;
  decimals?: number;
  category?: string;
  subcategory?: string;
  verified?: boolean;
  price?: number;
  marketCap?: number;
  price1d?: number;
  price7d?: number;
  currentSupply?: number;
  tokenAmountVolume24h?: number;
  usdValueVolume24h?: number;
  updateTime?: number;
}

const tokenLogo = document.getElementById('tokenLogo') as HTMLImageElement;
const tokenSymbol = document.getElementById('tokenSymbol') as HTMLElement;
const tokenName = document.getElementById('tokenName') as HTMLElement;
const tokenStats = document.getElementById('tokenStats') as HTMLElement;

function formatNum(n: number | string | null | undefined): string {
  if (n == null) return '—';
  if (typeof n === 'number') {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(4);
  }
  return String(n);
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  const trim = (s: string) => s.replace(/\.?0+$/, '') || '0';
  if (num >= 1) {
    const s = num.toFixed(2);
    return s.endsWith('.00') ? s.replace(/\.00$/, '') : s;
  }
  if (num > 0.0099) return trim(num.toFixed(4));
  return trim(num.toFixed(12));
}

function setTokenLastUpdated(text: string): void {
  const el = document.getElementById('tokenLastUpdatedValue');
  if (el) el.textContent = text;
}

const TOKEN_LAST_UPDATED_ICON =
  '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

function tokenLastUpdatedRowHtml(): string {
  return `<div class="token-stat-row token-stat-row--lastUpdated" role="group" aria-label="Last updated">
    <div class="token-stat-row-icon" aria-hidden="true">${TOKEN_LAST_UPDATED_ICON}</div>
    <div class="token-stat-row-body">
      <span class="token-stat-row-label">Last updated</span>
      <span class="token-stat-row-value" id="tokenLastUpdatedValue">—</span>
    </div>
  </div>`;
}
const VYBE_TOKEN = 'https://vybe.fyi/tokens/';
const PUMP_MINT_FALLBACK_LOGO_URL =
  'https://s2.coinmarketcap.com/static/img/coins/64x64/36507.png';

function truncateMintMiddle(mint: string | undefined, head = 5, tail = 5): string {
  const m = (mint || '').trim();
  if (!m) return '';
  if (m.length <= head + tail + 4) return m;
  return `${m.slice(0, head)}....${m.slice(-tail)}`;
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resolveTokenLogoSrc(logoUrl: string | undefined, mintAddress: string | undefined): string {
  const trimmed = (logoUrl || '').trim();
  if (trimmed) return trimmed;
  const mint = (mintAddress || '').trim();
  if (mint.endsWith('pump')) return PUMP_MINT_FALLBACK_LOGO_URL;
  return '';
}

function parseLeadingZeroFraction(normalized: string): { zeroRun: number; sigRest: string } | null {
  const m = normalized.match(/^0\.(\d*)$/);
  if (!m) return null;
  const frac = m[1] ?? '';
  let i = 0;
  while (i < frac.length && frac[i] === '0') i++;
  if (i >= frac.length) return { zeroRun: frac.length, sigRest: '' };
  return { zeroRun: i, sigRest: frac.slice(i) };
}

function formatTokenStatPriceValueHtml(
  n: number | null | undefined,
  opts?: { usdSuffix?: boolean }
): string {
  if (n == null || !Number.isFinite(Number(n))) return escapeHtmlText('—');
  const raw = Number(n);
  const neg = raw < 0;
  const num = Math.abs(raw);
  const minus = neg ? '<span class="token-stat-price-neg">−</span>' : '';
  const suffix = opts?.usdSuffix ? '<span class="token-stat-price-suffix">USD</span>' : '';

  if (num === 0) {
    return `${minus}<span class="token-stat-row-price-num">0</span>${suffix}`;
  }
  if (num >= 1) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const s = num.toFixed(24).replace(/\.?0+$/, '');
  const parsed = parseLeadingZeroFraction(s);
  if (!parsed || parsed.sigRest.length === 0) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const { zeroRun, sigRest } = parsed;
  if (zeroRun === 0) {
    return `${minus}<span class="token-stat-row-price-num">${escapeHtmlText(formatPrice(neg ? -num : num))}</span>${suffix}`;
  }

  const mantissa = zeroRun <= 1 ? sigRest.slice(1, 5) : sigRest.slice(0, 4);
  return `${minus}<span class="token-stat-row-price-num token-stat-row-price-num--compact">0.0<sup class="token-price-zero-run">${String(zeroRun)}</sup>${escapeHtmlText(mantissa)}</span>${suffix}`;
}

function formatCategoryOverviewValueHtml(category: string | undefined, subcategory: string | undefined): string {
  const cat = (category ?? '').trim();
  const sub = (subcategory ?? '').trim();
  if (!cat && !sub) return escapeHtmlText('—');
  if (cat && sub) return escapeHtmlText(`${cat} (${sub})`);
  return escapeHtmlText(cat || sub);
}

function prefixTokenStatUsdDollar(priceHtml: string): string {
  if (priceHtml.includes('token-stat-price-neg')) {
    return priceHtml.replace(
      /^(<span class="token-stat-price-neg">[\s\S]*?<\/span>)/,
      `$1<span class="token-stat-usd-dollar" aria-hidden="true">$</span>`
    );
  }
  return `<span class="token-stat-usd-dollar" aria-hidden="true">$</span>${priceHtml}`;
}

function wrapTokenStatUsdHtml(innerHtml: string): string {
  return `<span class="token-stat-usd-value">${innerHtml}</span>`;
}

function wrapTokenStatUsdText(escapedPlain: string): string {
  return `<span class="token-stat-usd-value">${escapedPlain}</span>`;
}

function usdVolStatDisplayTier(refAbs: number): 'B' | 'M' | 'K' | 'raw' {
  const abs = Math.abs(refAbs);
  if (abs >= 1e9) return 'B';
  if (abs >= 1e6) return 'M';
  if (abs >= 1e3) return 'K';
  return 'raw';
}

function formatUsdVolStatAligned(value: number, tier: 'B' | 'M' | 'K' | 'raw'): string {
  let numPart: string;
  switch (tier) {
    case 'B':
      numPart = (value / 1e9).toFixed(2);
      break;
    case 'M':
      numPart = (value / 1e6).toFixed(2);
      break;
    case 'K':
      numPart = (value / 1e3).toFixed(2);
      break;
    default:
      numPart = value.toFixed(4);
  }
  numPart = numPart.replace(/\.?0+$/, '');
  const suf = tier === 'raw' ? '' : tier;
  return `${numPart}${suf}`;
}

function formatPctSmart(value: number): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return '0%';
  const abs = Math.abs(num);
  if (abs >= 0.01) return `${num.toFixed(2)}%`;
  const decimalsToFirstNonZero = Math.ceil(-Math.log10(abs));
  const decimals = Math.max(3, Math.min(8, decimalsToFirstNonZero));
  return `${num.toFixed(decimals)}%`;
}

type HistoricalPricePctPeriod = '24hr' | '7d';

function formatHistoricalPricePctVsSpotHtml(
  spot: number | undefined,
  historical: number | undefined,
  period: HistoricalPricePctPeriod
): string {
  if (spot == null || historical == null || !Number.isFinite(spot) || !Number.isFinite(historical) || spot === 0) {
    return '';
  }
  const pct = ((spot - historical) / spot) * 100;
  const toneClass =
    pct > 0 ? 'usd-tone usd-tone--positive' : pct < 0 ? 'usd-tone usd-tone--negative' : 'usd-tone usd-tone--neutral';
  const sign = pct > 0 ? '+' : '';
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '';
  const pctSpan = `<span class="token-stat-price-pct ${toneClass}">${sign}${formatPctSmart(pct)}</span>`;
  const arrowSpan = arrow
    ? `<span class="token-stat-price-pct-arrow ${toneClass}" aria-hidden="true">${arrow}</span>`
    : '';
  const periodSpan = `<span class="token-stat-price-pct-period">${escapeHtmlText(period)}</span>`;
  const meta = `<span class="token-stat-price-pct-meta">${arrowSpan}${periodSpan}</span>`;
  return ` ${pctSpan}${meta}`;
}

const tokenSectionIcons: Record<string, string> = {
  overview:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>',
  price:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  supply:
    '<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
};

type TokenStatRowKey =
  | 'mint'
  | 'decimals'
  | 'category'
  | 'verified'
  | 'priceUsd'
  | 'marketCap'
  | 'price1d'
  | 'price7d'
  | 'supply'
  | 'tokenVol24h'
  | 'usdVol24h';

interface TokenStatRow {
  key: TokenStatRowKey;
  label: string;
  valueHtml: string;
}

const TOKEN_STAT_ROW_ICONS: Record<TokenStatRowKey, string> = {
  mint:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  decimals:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h8M8 18h5"/></svg>',
  category:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  verified:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  priceUsd:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  marketCap:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  price1d:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  price7d:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  supply:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  tokenVol24h:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  usdVol24h:
    '<svg class="token-stat-row-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
};

interface TokenStatSectionSpec {
  icon: string;
  title: string;
  theme: 'overview' | 'price' | 'supply';
  rows: TokenStatRow[];
}

function tokenStatRowHtml(row: TokenStatRow): string {
  const icon = TOKEN_STAT_ROW_ICONS[row.key];
  const aria = escapeHtmlAttr(row.label);
  return `<div class="token-stat-row token-stat-row--${row.key}" role="group" aria-label="${aria}">
    <div class="token-stat-row-icon" aria-hidden="true">${icon}</div>
    <div class="token-stat-row-body">
      <span class="token-stat-row-label">${escapeHtmlText(row.label)}</span>
      <span class="token-stat-row-value">${row.valueHtml}</span>
    </div>
  </div>`;
}

function tokenStatSectionHtml(s: TokenStatSectionSpec): string {
  const rows = s.rows.map((r) => tokenStatRowHtml(r)).join('');
  return `<section class="token-stats-group token-stats-group--${s.theme}">
      <h3 class="token-stats-group-title">${s.icon}<span>${s.title}</span></h3>
      <div class="token-stat-rows">${rows}</div>
    </section>`;
}

/** e.g. Saturday May 15, 2027 at 5:50PM */
function formatTokenUpdateTime(ts: number | undefined): string {
  if (ts == null) return '—';
  const d = new Date(ts * 1000);
  const weekday = d.toLocaleString('en-US', { weekday: 'long' });
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minuteStr = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${weekday} ${month} ${day}, ${year} at ${hours}:${minuteStr}${ampm}`;
}

function buildTokenStatsPlaceholderHtml(): string {
  const d = escapeHtmlText('—');
  const overview: TokenStatSectionSpec = {
    icon: tokenSectionIcons.overview,
    title: 'Overview',
    theme: 'overview',
    rows: [
      { key: 'mint', label: 'Mint', valueHtml: `<span class="mono">${d}</span>` },
      { key: 'category', label: 'Category', valueHtml: d },
      { key: 'verified', label: 'Verified', valueHtml: d },
      { key: 'decimals', label: 'Decimals', valueHtml: d },
    ],
  };
  const priceSection: TokenStatSectionSpec = {
    icon: tokenSectionIcons.price,
    title: 'Price & market cap',
    theme: 'price',
    rows: [
      { key: 'priceUsd', label: 'Price (USD)', valueHtml: d },
      { key: 'marketCap', label: 'Market cap', valueHtml: d },
      { key: 'price1d', label: 'Price (24h ago)', valueHtml: d },
      { key: 'price7d', label: 'Price (7d ago)', valueHtml: d },
    ],
  };
  const supplyVolumeSection: TokenStatSectionSpec = {
    icon: tokenSectionIcons.supply,
    title: 'Supply & volume (24h)',
    theme: 'supply',
    rows: [
      { key: 'supply', label: 'Current supply', valueHtml: d },
      { key: 'tokenVol24h', label: 'Token volume (24h)', valueHtml: d },
      { key: 'usdVol24h', label: 'USD volume (24h)', valueHtml: d },
    ],
  };
  return tokenStatsMainRowHtml(overview, priceSection, supplyVolumeSection);
}

function tokenStatsMainRowHtml(
  overview: TokenStatSectionSpec,
  priceSection: TokenStatSectionSpec,
  supplyVolumeSection: TokenStatSectionSpec
): string {
  return `<div class="token-stats-row token-stats-row--split-overview"><div class="token-stats-col token-stats-col--overview">${tokenStatSectionHtml(overview)}</div><div class="token-stats-col token-stats-col--pair"><div class="token-stats-pair-grid">${tokenStatSectionHtml(priceSection)}<div class="token-stats-supply-stack">${tokenLastUpdatedRowHtml()}${tokenStatSectionHtml(supplyVolumeSection)}</div></div></div></div>`;
}

function renderToken(t: TokenData): void {
  const tokenLogoSrc = resolveTokenLogoSrc(t.logoUrl, t.mintAddress);
  tokenLogo.src = tokenLogoSrc;
  tokenLogo.alt = t.symbol || '';
  tokenLogo.style.display = tokenLogoSrc ? 'block' : 'none';
  tokenSymbol.textContent = t.symbol || '—';
  const nameTrim = (t.name || '').trim();
  const mintTrim = (t.mintAddress || '').trim();
  if (nameTrim) {
    tokenName.textContent = nameTrim;
    tokenName.removeAttribute('title');
  } else if (mintTrim) {
    tokenName.textContent = truncateMintMiddle(mintTrim);
    tokenName.title = mintTrim;
  } else {
    tokenName.textContent = '—';
    tokenName.removeAttribute('title');
  }

  const sym = (t.symbol || '').toUpperCase();
  const dashTxt = escapeHtmlText('—');
  const mintLink = mintTrim
    ? `<a href="${VYBE_TOKEN}${encodeURIComponent(mintTrim)}" target="_blank" rel="noopener" class="mono" title="${escapeHtmlAttr(mintTrim)}">${truncateMintMiddle(mintTrim)}</a>`
    : '';
  const decVal = t.decimal ?? t.decimals;
  const overview: TokenStatSectionSpec = {
    icon: tokenSectionIcons.overview,
    title: 'Overview',
    theme: 'overview',
    rows: [
      { key: 'mint', label: 'Mint', valueHtml: mintLink || dashTxt },
      {
        key: 'category',
        label: 'Category',
        valueHtml: formatCategoryOverviewValueHtml(t.category, t.subcategory),
      },
      {
        key: 'verified',
        label: 'Verified',
        valueHtml: t.verified != null ? escapeHtmlText(String(t.verified)) : dashTxt,
      },
      {
        key: 'decimals',
        label: 'Decimals',
        valueHtml: decVal != null ? escapeHtmlText(String(decVal)) : dashTxt,
      },
    ],
  };
  const priceSection: TokenStatSectionSpec = {
    icon: tokenSectionIcons.price,
    title: 'Price & market cap',
    theme: 'price',
    rows: [
      {
        key: 'priceUsd',
        label: 'Price (USD)',
        valueHtml:
          t.price != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price, { usdSuffix: true })))
            : dashTxt,
      },
      {
        key: 'marketCap',
        label: 'Market cap',
        valueHtml:
          t.marketCap != null
            ? wrapTokenStatUsdText(escapeHtmlText(`$${formatNum(t.marketCap)} USD`))
            : dashTxt,
      },
      {
        key: 'price1d',
        label: 'Price (24h ago)',
        valueHtml:
          t.price1d != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price1d))) +
              formatHistoricalPricePctVsSpotHtml(t.price, t.price1d, '24hr')
            : dashTxt,
      },
      {
        key: 'price7d',
        label: 'Price (7d ago)',
        valueHtml:
          t.price7d != null
            ? wrapTokenStatUsdHtml(prefixTokenStatUsdDollar(formatTokenStatPriceValueHtml(t.price7d))) +
              formatHistoricalPricePctVsSpotHtml(t.price, t.price7d, '7d')
            : dashTxt,
      },
    ],
  };
  const supplyVolumeSection: TokenStatSectionSpec = {
    icon: tokenSectionIcons.supply,
    title: 'Supply & volume (24h)',
    theme: 'supply',
    rows: [
      {
        key: 'supply',
        label: 'Current supply',
        valueHtml:
          t.currentSupply != null
            ? escapeHtmlText(`${formatNum(t.currentSupply)}${sym ? ` ${sym}` : ''}`)
            : dashTxt,
      },
      {
        key: 'tokenVol24h',
        label: 'Token volume (24h)',
        valueHtml:
          t.tokenAmountVolume24h != null
            ? escapeHtmlText(`${formatNum(t.tokenAmountVolume24h)}${sym ? ` ${sym}` : ''}`)
            : dashTxt,
      },
      {
        key: 'usdVol24h',
        label: 'USD volume (24h)',
        valueHtml:
          t.usdValueVolume24h != null && Number.isFinite(t.usdValueVolume24h)
            ? wrapTokenStatUsdText(
                escapeHtmlText(
                  `$${formatUsdVolStatAligned(t.usdValueVolume24h, usdVolStatDisplayTier(t.usdValueVolume24h))} USD`
                )
              )
            : dashTxt,
      },
    ],
  };

  tokenStats.innerHTML = tokenStatsMainRowHtml(overview, priceSection, supplyVolumeSection);
  setTokenLastUpdated(formatTokenUpdateTime(t.updateTime));
}

export function renderTokenStatsEmpty(): void {
  tokenLogo.style.display = 'none';
  tokenLogo.src = '';
  tokenLogo.alt = '';
  tokenSymbol.textContent = '—';
  tokenName.textContent = '—';
  tokenName.removeAttribute('title');
  tokenStats.innerHTML = buildTokenStatsPlaceholderHtml();
  setTokenLastUpdated('—');
}

export function renderTokenStats(data: TokenData): void {
  renderToken(data);
}

export function vybeBodyToTokenData(body: Record<string, unknown>, mintFallback: string): TokenData {
  const num = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (v: unknown): boolean | undefined =>
    typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : undefined;

  return {
    symbol: typeof body.symbol === 'string' ? body.symbol : undefined,
    name: typeof body.name === 'string' ? body.name : undefined,
    mintAddress: (typeof body.mintAddress === 'string' ? body.mintAddress : mintFallback) || mintFallback,
    logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl : undefined,
    decimal: num(body.decimal ?? body.decimals),
    decimals: num(body.decimals ?? body.decimal),
    category: typeof body.category === 'string' ? body.category : undefined,
    subcategory: typeof body.subcategory === 'string' ? body.subcategory : undefined,
    verified: bool(body.verified),
    price: num(body.price ?? body.priceUsd),
    marketCap: num(body.marketCap ?? body.marketCapUsd),
    price1d: num(body.price1d),
    price7d: num(body.price7d),
    currentSupply: num(body.currentSupply),
    tokenAmountVolume24h: num(body.tokenAmountVolume24h),
    usdValueVolume24h: num(body.usdValueVolume24h ?? body.volume24hUsd),
    updateTime: num(body.updateTime),
  };
}
