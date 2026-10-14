export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidation {
  valid: boolean;
  length: number;
  error?: string;
}

/** 제출 시 trim 되는 값 기준으로 프롬프트 길이를 검증한다. 서로게이트 쌍(이모지)은 한 글자로 센다. */
export function validatePromptLength(prompt: string): PromptValidation {
  const length = [...prompt.trim()].length;
  if (length > MAX_PROMPT_LENGTH) {
    return { valid: false, length, error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요.` };
  }
  return { valid: true, length };
}
