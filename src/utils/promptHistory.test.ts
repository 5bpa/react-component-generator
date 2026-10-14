import { describe, it, expect } from 'vitest';
import { MAX_HISTORY, addToHistory } from './promptHistory';

describe('addToHistory', () => {
  it('최대 개수는 20개다', () => {
    expect(MAX_HISTORY).toBe(20);
  });

  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('앞뒤 공백을 제거하고 저장한다', () => {
    expect(addToHistory([], '  카드  ')).toEqual(['카드']);
  });

  it('빈 프롬프트는 무시한다', () => {
    expect(addToHistory(['a'], '   ')).toEqual(['a']);
  });

  it('최대 개수를 넘으면 가장 오래된 항목부터 버린다', () => {
    const full = Array.from({ length: 20 }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(20);
    expect(next[0]).toBe('new');
    expect(next).not.toContain('p19');
  });

  it('원본 배열을 변경하지 않는다', () => {
    const original = ['a'];
    addToHistory(original, 'b');
    expect(original).toEqual(['a']);
  });
});
