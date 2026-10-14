import type { GeneratedComponent, Provider } from '../types';
import { MAX_HISTORY } from './promptHistory';

export const STORAGE_KEYS = {
  apiKeys: 'rcg.apiKeys',
  provider: 'rcg.provider',
  promptHistory: 'rcg.promptHistory',
  components: 'rcg.components',
} as const;

export const DEFAULT_PROVIDER: Provider = 'google';

const PROVIDERS: Provider[] = ['anthropic', 'google'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 저장된 컴포넌트 목록을 검증하고 createdAt 문자열을 Date로 복원한다. 잘못된 항목은 버린다. */
export function parseComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): GeneratedComponent[] => {
    if (!isRecord(item)) return [];
    const { id, prompt, code, createdAt } = item;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') return [];
    if (typeof createdAt !== 'string') return [];
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return [];
    return [{ id, prompt, code, createdAt: date }];
  });
}

export function parseProvider(raw: unknown): Provider {
  return PROVIDERS.find((provider) => provider === raw) ?? DEFAULT_PROVIDER;
}

export function parseApiKeys(raw: unknown): Partial<Record<Provider, string>> {
  if (!isRecord(raw)) return {};
  const keys: Partial<Record<Provider, string>> = {};
  for (const provider of PROVIDERS) {
    const value = raw[provider];
    if (typeof value === 'string') keys[provider] = value;
  }
  return keys;
}

export function parseHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .slice(0, MAX_HISTORY);
}
