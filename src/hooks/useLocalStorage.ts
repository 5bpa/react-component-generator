import { useState, useEffect } from 'react';

/**
 * useState와 같은 인터페이스로 값을 localStorage에 유지한다.
 * 저장소 접근 실패(비공개 모드, 용량 초과)나 깨진 데이터는 조용히 무시하고 초기값으로 동작한다.
 * parse는 저장된 JSON을 검증·변환하며, 예외를 던지면 초기값을 쓴다.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  parse: (raw: unknown) => T = (raw) => raw as T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : parse(JSON.parse(stored));
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 무시한다. 메모리 상태로는 계속 동작한다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
