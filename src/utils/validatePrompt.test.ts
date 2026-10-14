import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('최대 길이는 500자다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('500자 이하면 유효하다', () => {
    const result = validatePromptLength('a'.repeat(500));
    expect(result).toEqual({ valid: true, length: 500 });
  });

  it('501자부터는 에러 메시지와 함께 무효다', () => {
    const result = validatePromptLength('a'.repeat(501));
    expect(result.valid).toBe(false);
    expect(result.length).toBe(501);
    expect(result.error).toContain('500');
  });

  it('앞뒤 공백은 길이에서 제외한다 (제출 시 trim 되므로)', () => {
    const result = validatePromptLength(`  ${'a'.repeat(500)}  `);
    expect(result).toEqual({ valid: true, length: 500 });
  });

  it('이모지 등 서로게이트 쌍은 한 글자로 센다', () => {
    const result = validatePromptLength('😀'.repeat(500));
    expect(result).toEqual({ valid: true, length: 500 });
  });
});
