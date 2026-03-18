/**
 * Persistent JSON cache for symbol, program-label, and holder lookups.
 * Read from disk before each request; write to disk when a new record is added.
 * No startup load — next request sees updates made while the server is running.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { VybeProgramsResponse, VybeTopHolder } from './types/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Cache files at project root (same pattern as solana-token-stats-metadata-api / historical-trade). */
const ROOT_DIR = path.resolve(__dirname, '..');
const SYMBOL_CACHE_PATH = path.join(ROOT_DIR, 'symbol-cache.json');
const PROGRAM_CACHE_PATH = path.join(ROOT_DIR, 'program-label-cache.json');
const HOLDER_CACHE_PATH = path.join(ROOT_DIR, 'holder-cache.json');

let cachePathsLogged = false;
function logCachePathsOnce(): void {
  if (cachePathsLogged) return;
  cachePathsLogged = true;
  console.log('Cache files (project root):');
  console.log('  symbol:', SYMBOL_CACHE_PATH);
  console.log('  program:', PROGRAM_CACHE_PATH);
  console.log('  holder:', HOLDER_CACHE_PATH);
}

/** TTL for holder cache: 3 hours (aligns with Vybe "updated every 3 hours"). */
export const HOLDER_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export interface HolderCacheEntry {
  data: VybeTopHolder[];
  fetchedAt: number;
}

export type HolderCache = Record<string, HolderCacheEntry>;

function readJsonFile<T>(filePath: string, defaultVal: T): T {
  if (!fs.existsSync(filePath)) return defaultVal;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T;
    return parsed != null && typeof parsed === 'object' ? parsed : defaultVal;
  } catch {
    return defaultVal;
  }
}

function writeJsonFile(filePath: string, data: object): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
}

export function readSymbolCacheFromDisk(): Record<string, string> {
  logCachePathsOnce();
  return readJsonFile<Record<string, string>>(SYMBOL_CACHE_PATH, {});
}

export function writeSymbolCacheToDisk(data: Record<string, string>): void {
  writeJsonFile(SYMBOL_CACHE_PATH, data);
}

export function readProgramCacheFromDisk(): Record<string, VybeProgramsResponse> {
  logCachePathsOnce();
  return readJsonFile<Record<string, VybeProgramsResponse>>(PROGRAM_CACHE_PATH, {});
}

export function writeProgramCacheToDisk(data: Record<string, VybeProgramsResponse>): void {
  writeJsonFile(PROGRAM_CACHE_PATH, data);
}

export function readHolderCacheFromDisk(): HolderCache {
  logCachePathsOnce();
  return readJsonFile<HolderCache>(HOLDER_CACHE_PATH, {});
}

export function writeHolderCacheToDisk(data: HolderCache): void {
  writeJsonFile(HOLDER_CACHE_PATH, data);
}
