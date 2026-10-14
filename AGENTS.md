# AGENTS.md

## Operational Commands

- 패키지 매니저는 bun 고정 (`bun.lock`). npm/yarn/pnpm 사용 금지.
- 설치: `bun install`
- 개발 (API 서버 + Vite 동시): `bun run dev`
- 단위 테스트: `bun run test` (vitest 실행). `bun test` 직접 호출 금지 — bun 내장 러너는 jsdom 설정(`vite.config.ts:17-19`)을 읽지 않는다.
- 단일 테스트: `bunx vitest run server/fallback.test.ts`
- 린트: `bun run lint`
- 타입체크 + 빌드: `bun run build` (`tsc -b && vite build`)
- 변경 후 최소 `bun run test`, `bun run lint`, `bun run build` 통과를 확인한다.

## Golden Rules

### Immutable

- 서버 포트 3002는 `server/index.ts:139`와 `vite.config.ts:11`에 각각 하드코딩되어 있다. 한쪽만 바꾸지 말고 항상 함께 수정한다.
- API 키(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)는 서버 프로세스에서만 읽는다(`server/index.ts:59-62`). 클라이언트 번들, 로그, 에러 메시지로 값을 내보내지 않는다.
- `/api/config`는 키 보유 여부(boolean)만 반환한다(`server/index.ts:150-153`). 키 값을 응답에 추가하지 않는다.
- 사용자가 UI에 입력한 키는 React state에만 둔다(`src/App.tsx:14`). localStorage 등에 영속화하지 않는다.
- `.env`는 커밋하지 않는다(`.gitignore`). 키 형식 문자열을 테스트·문서에 실제 값으로 넣지 않는다.

### Do's and Don'ts

- 생성 코드 계약을 한 곳만 바꾸지 마라. 시스템 프롬프트(`server/index.ts:7-49`), 후처리(`server/generator.ts`), 미리보기(`src/components/LivePreview.tsx:14`의 `noInline`)는 한 세트다. 하나를 바꾸면 나머지와 테스트를 함께 점검한다.
- AI가 생성하는 코드는 import 없이 전역 React를 쓰고, TypeScript 문법 없이 `render(<X />)`로 끝나야 한다(`server/index.ts:11,20`; react-live `noInline` 요구). 이 제약을 완화하는 프롬프트 수정 금지.
- 이중 방어를 하나만 남기지 마라. 코드펜스는 프롬프트로 금지(`server/index.ts:16`)하면서도 `stripCodeFences`(`server/generator.ts:5`)로 제거하고, `render` 호출도 프롬프트(`:12`)와 `ensureRenderCall`(`server/generator.ts:16`) 양쪽에서 보장한다. 모델 응답은 프롬프트를 어길 수 있다.
- 서버 응답 에러 문구는 한국어, 콘솔·내부 에러는 기존 형식(`Claude API error: <status>`)을 유지한다. 상태 코드 분기가 문자열 매칭이다(아래 Asymmetry 참고).

### 비대칭 (Asymmetry)

- Google 경로에만 모델 폴백(`server/index.ts:5,134-136`)과 `MAX_TOKENS` 잘림 감지(`:123-125`)가 있고, Anthropic 경로(`:68-96`)에는 없다. 한 프로바이더 동작을 바꿀 때 다른 쪽에 같은 처리가 필요한지 확인하고, 의도된 차이라면 유지한다.
- 에러 → HTTP 상태 변환은 `message.includes('503')`, `includes('429')` 문자열 매칭이다(`server/index.ts:194,201`). 업스트림 에러 메시지에서 상태 코드를 빼면 503/429 처리가 조용히 500으로 바뀐다.

### 테스트 경계 (Test Boundary)

- 테스트 대상은 부수효과 없는 순수 모듈(`server/generator.ts`, `server/fallback.ts`)과 `PromptInput`뿐이다. `server/generator.ts:1-2`의 주석처럼 테스트 가능성을 위해 `Bun.serve`와 분리되어 있다.
- `server/index.ts`는 import 시 서버를 기동하므로 테스트에서 import 금지. 새 로직은 순수 함수로 별도 파일에 두고 테스트를 작성한 뒤 `index.ts`에서 호출한다.
- vitest 포함 범위는 `src/**/*.test.{ts,tsx}`와 `server/**/*.test.ts`다(`vite.config.ts:20`). 다른 위치의 테스트는 실행되지 않는다.

### 보안 경계 (Security Boundary)

- Google 호출은 API 키를 URL 쿼리로 전달한다(`server/index.ts:99`). 해당 URL이나 fetch 에러 객체를 로그·응답에 출력하지 않는다.
- CORS는 `*`로 열려 있다(`server/index.ts:51-55`). 서버를 로컬 개발 외 환경에 노출하려면 먼저 오리진 제한과 인증을 추가한다.
- 생성된 코드는 react-live가 브라우저에서 런타임 실행한다. 생성 결과를 서버에서 평가·저장·실행하는 기능을 추가하지 않는다.

## Project Context

- 목표: 프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 제공.
- Stack: React 19, TypeScript, Vite, Bun, react-live, vitest, Anthropic/Google Gemini API.
- 설치·실행·기능 설명은 `README.md` 참고.

## Standards and References

- 커밋: 한국어 `<type>: <요약>`, type은 feat / fix / refactor / chore. 이 저장소의 `commit` 스킬(`.claude/skills/commit/SKILL.md`)을 따른다.
- Gemini 모델 목록과 Claude 모델 ID는 `server/index.ts`에 하드코딩되어 있다. 변경 시 해당 상수만 수정한다.
- Maintenance Policy: 이 파일의 규칙과 코드가 어긋난 것을 발견하면 작업 중단 없이 수정안을 제안한다. 근거 라인 번호가 바뀌면 함께 갱신한다.

## Nested Rules

- 서버 코드 작업 시 `server/AGENTS.md`를 함께 따른다.
