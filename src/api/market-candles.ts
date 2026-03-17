/**
 * Vybe market OHLC candles: GET /v4/markets/{marketAddress}/candles.
 * @see https://docs.vybenetwork.com/reference/get_market_filtered_ohlcv_v4
 */

import type { AxiosInstance } from 'axios';
import type { VybeCandlesResponse } from '../types/api.js';
import { withRetry } from './client.js';
import type { GetCandlesParams } from './candles.js';

/**
 * Fetch OHLC candles for a given market/pool.
 */
export async function getMarketCandles(
  http: AxiosInstance,
  marketAddress: string,
  params: GetCandlesParams = {}
): Promise<VybeCandlesResponse> {
  const filtered: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    filtered[k] = v as string | number | boolean;
  }

  return withRetry(async () => {
    const { data } = await http.get<VybeCandlesResponse>(`/v4/markets/${marketAddress}/candles`, {
      params: filtered,
    });
    return data;
  });
}
