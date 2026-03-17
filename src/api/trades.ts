/**
 * Vybe trade history: GET /v4/trades with full query param support.
 * @see https://docs.vybenetwork.com/reference/get_trade_data_program_v4
 */

import type { AxiosInstance } from 'axios';
import type { VybeProgramsResponse, VybeTradesResponse } from '../types/api.js';
import { withRetry } from './client.js';

export type TradesSortField = 'price' | 'blockTime';

export interface GetTradesParams {
  programAddress?: string;
  baseMintAddress?: string;
  quoteMintAddress?: string;
  /** Either base or quote token (per docs). */
  mintAddress?: string;
  /**
   * Market id (pool) to filter with.
   * If provided, the baseMintAddress and quoteMintAddress fields are ignored by the API.
   */
  marketAddress?: string;
  authorityAddress?: string;
  feePayerAddress?: string;

  /** Deprecated/optional per docs; included for completeness. */
  resolution?: string;

  timeStart?: number;
  timeEnd?: number;
  page?: number;
  limit?: number;
  sortByAsc?: TradesSortField;
  sortByDesc?: TradesSortField;
}

/**
 * Fetch trade history with filtering + pagination.
 * @param http - Authenticated axios instance
 * @param params - Query params; only defined keys are forwarded
 */
export async function getTrades(http: AxiosInstance, params: GetTradesParams): Promise<VybeTradesResponse> {
  const filtered: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    filtered[k] = v as string | number;
  }

  return withRetry(async () => {
    const { data } = await http.get<VybeTradesResponse>('/v4/trades', { params: filtered });
    return data;
  });
}

/**
 * Fetch labeled program for a single program address.
 * GET /v4/programs/labeled-program-accounts?programAddress=xxx — one request per address.
 */
export async function getLabeledProgramAccount(
  http: AxiosInstance,
  programAddress: string
): Promise<VybeProgramsResponse> {
  try {
    return await withRetry(async () => {
      const { data } = await http.get<VybeProgramsResponse>('/v4/programs/labeled-program-accounts', {
        params: { programAddress: programAddress.trim() },
      });
      return data;
    });
  } catch {
    return { programs: [] };
  }
}

