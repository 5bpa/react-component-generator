import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('저장된 값이 없으면 초기값을 반환한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 그 값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => result.current[1]('next'));
    expect(JSON.parse(localStorage.getItem('k')!)).toBe('next');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', [1]));
    act(() => result.current[1]((prev) => [...prev, 2]));
    expect(result.current[0]).toEqual([1, 2]);
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual([1, 2]);
  });

  it('새로 마운트해도 이전 값이 유지된다', () => {
    const first = renderHook(() => useLocalStorage('k', 'init'));
    act(() => first.result.current[1]('kept'));
    first.unmount();

    const second = renderHook(() => useLocalStorage('k', 'init'));
    expect(second.result.current[0]).toBe('kept');
  });

  it('저장된 JSON이 깨져 있으면 초기값으로 시작한다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('parse 함수로 저장된 값을 검증·변환한다', () => {
    localStorage.setItem('k', JSON.stringify(['1', 2]));
    const { result } = renderHook(() =>
      useLocalStorage<string[]>('k', [], (raw) => (raw as unknown[]).map(String)),
    );
    expect(result.current[0]).toEqual(['1', '2']);
  });

  it('parse가 예외를 던지면 초기값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('x'));
    const { result } = renderHook(() =>
      useLocalStorage('k', 'init', () => {
        throw new Error('invalid');
      }),
    );
    expect(result.current[0]).toBe('init');
  });
});
