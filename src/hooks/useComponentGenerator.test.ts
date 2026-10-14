import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/persistedState';

function mockGenerateResponse(code: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code }) }),
  );
}

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => mockGenerateResponse('const A = () => <div />; render(<A />);'));
  afterEach(() => vi.unstubAllGlobals());

  it('생성한 컴포넌트가 새로 마운트해도 유지된다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('카드', undefined, 'google'));
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components).toHaveLength(1);
    expect(second.result.current.components[0].prompt).toBe('카드');
    expect(second.result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('컴포넌트를 삭제하면 저장소에서도 사라진다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('카드', undefined, 'google'));
    act(() => first.result.current.removeComponent(first.result.current.components[0].id));
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components).toEqual([]);
  });

  it('전체 삭제하면 저장소에서도 비워진다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('카드', undefined, 'google'));
    act(() => first.result.current.clearAll());

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components) ?? 'null')).toEqual([]);
  });

  it('저장된 데이터가 깨져 있어도 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.components, '{broken');
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });
});
