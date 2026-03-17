/**
 * Vybe token OHLC candles: GET /v4/tokens/{mintAddress}/candles.
 * Used to power the candlestick chart from pre-aggregated OHLCV data.
 * @see https://docs.vybenetwork.com/docs/fetch-ohlc-candles
 */

import type { AxiosInstance } from 'axios';
import type { VybeCandlesResponse } from '../types/api.js';
import { withRetry } from './client.js';

export interface GetCandlesParams {
  /**
   * Candle resolution: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 3h, 4h, 1d, 1w, 1mo, 1y. Default "1h".
   */
  resolution?: string;
  /**
   * Start time (Unix seconds). ≥ 0.
   */
  timeStart?: number;
  /**
   * End time (Unix seconds). ≥ 0.
   */
  timeEnd?: number;
  /**
   * Result page size. Default 1000.
   */
  limit?: number;
  /**
   * Page number for paginated results. ≥ 0.
   */
  page?: number;
  /**
   * Eliminate gaps between candles by using previous close as next open. Default true.
   */
  eliminateCloseToOpenGaps?: boolean;
}

/**
 * Fetch OHLC candles for a given mint.
 * @param http - Authenticated axios instance
 * @param mintAddress - SPL token mint address
 * @param params - Optional query params
 */
export async function getCandles(
  http: AxiosInstance,
  mintAddress: string,
  params: GetCandlesParams = {}
): Promise<VybeCandlesResponse> {
  const filtered: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    filtered[k] = v as string | number | boolean;
  }

  return withRetry(async () => {
    const { data } = await http.get<VybeCandlesResponse>(`/v4/tokens/${mintAddress}/candles`, {
      params: filtered,
    });
    return data;
  });
}

