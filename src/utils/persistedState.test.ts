import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEYS,
  parseApiKeys,
  parseComponents,
  parseHistory,
  parseProvider,
} from './persistedState';

describe('STORAGE_KEYS', () => {
  it('앱 접두사를 가진 서로 다른 키를 쓴다', () => {
    const keys = Object.values(STORAGE_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^rcg\./));
  });
});

describe('parseComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const iso = '2026-01-02T03:04:05.000Z';
    const [component] = parseComponents([{ id: '1', prompt: 'p', code: 'c', createdAt: iso }]);
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe(iso);
  });

  it('형식이 잘못된 항목은 걸러낸다', () => {
    const valid = { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' };
    const result = parseComponents([valid, { id: 2 }, null, 'x', { ...valid, createdAt: 'not-a-date' }]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('배열이 아니면 빈 배열이다', () => {
    expect(parseComponents({})).toEqual([]);
    expect(parseComponents(null)).toEqual([]);
  });
});

describe('parseProvider', () => {
  it('알려진 provider는 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });

  it('알 수 없는 값은 기본값 google이다', () => {
    expect(parseProvider('openai')).toBe('google');
    expect(parseProvider(42)).toBe('google');
  });
});

describe('parseApiKeys', () => {
  it('provider별 문자열 키만 남긴다', () => {
    expect(parseApiKeys({ anthropic: 'a', google: 'g', other: 'x', extra: 1 })).toEqual({
      anthropic: 'a',
      google: 'g',
    });
  });

  it('문자열이 아닌 값은 버린다', () => {
    expect(parseApiKeys({ anthropic: 1, google: 'g' })).toEqual({ google: 'g' });
  });

  it('객체가 아니면 빈 객체다', () => {
    expect(parseApiKeys('x')).toEqual({});
    expect(parseApiKeys(null)).toEqual({});
  });
});

describe('parseHistory', () => {
  it('비어 있지 않은 문자열만 남긴다', () => {
    expect(parseHistory(['a', '', 1, null, 'b'])).toEqual(['a', 'b']);
  });

  it('최대 20개까지만 남긴다', () => {
    const many = Array.from({ length: 30 }, (_, i) => `p${i}`);
    expect(parseHistory(many)).toHaveLength(20);
  });

  it('배열이 아니면 빈 배열이다', () => {
    expect(parseHistory('x')).toEqual([]);
  });
});
