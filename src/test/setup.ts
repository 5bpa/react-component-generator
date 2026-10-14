import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node의 실험적 전역 localStorage가 jsdom 것을 가려 동작하지 않으므로,
// 테스트에서는 메모리 기반 Storage로 고정해 환경과 무관하게 동작시킨다.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

// 각 테스트 후 렌더된 DOM과 저장소를 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
