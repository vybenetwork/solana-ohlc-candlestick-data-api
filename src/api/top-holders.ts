/**
 * Vybe top holders: GET /v4/tokens/{mintAddress}/top-holders.
 * @see https://docs.vybenetwork.com/reference/get_top_holders_v4
 */

import type { AxiosInstance } from 'axios';
import type { VybeTopHoldersResponse } from '../types/api.js';
import { withRetry } from './client.js';

export interface GetTopHoldersParams {
  page?: number;
  limit?: number;
  sortByAsc?: string;
  sortByDesc?: string;
}

/**
 * Fetch top holders for a token (up to 1000, paginated).
 */
export async function getTopHolders(
  http: AxiosInstance,
  mintAddress: string,
  params: GetTopHoldersParams = {}
): Promise<VybeTopHoldersResponse> {
  const filtered: Record<string, string | number> = {};
  if (params.page != null) filtered.page = params.page;
  if (params.limit != null) filtered.limit = Math.min(1000, Math.max(0, params.limit));
  if (params.sortByAsc != null && params.sortByAsc.trim()) filtered.sortByAsc = params.sortByAsc.trim();
  if (params.sortByDesc != null && params.sortByDesc.trim()) filtered.sortByDesc = params.sortByDesc.trim();

  return withRetry(async () => {
    const { data } = await http.get<VybeTopHoldersResponse>(
      `/v4/tokens/${encodeURIComponent(mintAddress.trim())}/top-holders`,
      { params: filtered }
    );
    return data;
  });
}
