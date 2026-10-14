# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI API 프록시(`index.ts`)와 그 순수 헬퍼(`generator.ts`, `fallback.ts`). Vite dev 서버가 `/api`를 이 서버로 프록시한다(`../vite.config.ts:9-14`).

## Tech Stack and Constraints

- 실행은 `bun --watch run server/index.ts`(`bun run server`). Node 전용 API보다 Bun 내장(`Bun.serve`, `process.env`, 전역 `fetch`)을 쓴다. 외부 HTTP 클라이언트(axios 등) 추가 금지, 기존대로 `fetch` 사용.
- 엔드포인트는 `GET /api/config`, `POST /api/generate`, `OPTIONS` 3가지다(`index.ts:141-213`). 새 응답에는 항상 `CORS_HEADERS`를 붙인다. 빠뜨리면 브라우저에서만 실패한다.

## Implementation Patterns

- 프로바이더 추가 순서: `Provider` 타입(`index.ts:57`) -> `ENV_KEYS`(`:59`) -> `call*` 함수 -> `/api/generate` 분기(`:183-186`) -> `/api/config`의 `envKeys`(`:150`) -> 프론트 `src/types/index.ts`의 `Provider`와 `src/App.tsx:8`의 `PROVIDER_CONFIG`. 하나라도 빠지면 UI에서 키 감지가 어긋난다.
- 테스트 가능한 로직은 `generator.ts`/`fallback.ts`처럼 부수효과 없는 파일로 분리하고 같은 이름의 `*.test.ts`를 옆에 둔다.
- 폴백(`withModelFallback`)은 모든 에러에서 다음 모델로 넘어가고 마지막 에러를 던진다(`fallback.ts:12-19`). 에러 종류별 분기가 필요하면 `attempt` 콜백 안에서 처리한다.

## Testing Strategy

- 실행: `bunx vitest run server/`
- 순수 함수 단위 테스트만 작성한다. `index.ts`를 import 하는 테스트는 서버가 기동되므로 작성하지 않는다.

## Local Golden Rules

- 프롬프트 응답 정규화는 `stripCodeFences` -> `ensureRenderCall` 순서다(`index.ts:188`). 순서를 바꾸면 펜스 안의 `render` 판별이 틀어진다.
- `ensureRenderCall`은 이미 `render(`가 있으면 코드를 건드리지 않는다(`generator.ts:17`). 컴포넌트 이름 추론은 대문자로 시작하는 첫 선언 기준이므로, 헬퍼 컴포넌트가 먼저 선언된 응답에서는 잘못된 컴포넌트를 렌더할 수 있다. 이 로직을 고칠 때는 `generator.test.ts`에 케이스를 추가한다.
- Anthropic 응답은 `text` 블록만 이어붙인다(`index.ts:92-95`). 다른 블록 타입을 포함시키지 않는다.
- 새 에러 메시지에 상태 코드가 필요하면 `<이름> API error: <status>` 형식을 따른다. `index.ts:194,201`의 문자열 매칭에 의존한다.
