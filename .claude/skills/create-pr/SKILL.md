---
name: create-pr
description: 현재 브랜치의 커밋과 변경사항을 분석해 언어별 PR 템플릿(이 프로젝트는 한국어, 그 외 영어)에 맞춘 제목·본문을 작성하고 GitHub PR을 생성한다. 사용자가 "PR 만들어줘", "PR 올려줘", "풀리퀘스트 생성", "pull request 열어줘", "리뷰 요청할 PR 만들어" 등을 말하거나 작업을 마치고 변경을 main에 합치려는 맥락이면, 스킬 이름을 말하지 않아도 이 스킬을 사용한다.
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Bash, Glob
---

# Create PR

이 스킬은 분리된 컨텍스트(fork)에서 실행된다. 메인 대화의 내용은 보이지 않으므로 필요한 정보는 모두 git 이력과 코드에서 직접 수집한다. 사용 도구는 Read, Grep, Bash, Glob뿐이다. 파일 생성·수정 도구가 없으므로 PR 본문은 `gh pr create`에 직접 넘긴다.

PR 본문 양식은 `references/` 아래 템플릿 파일이 단일 원본이다. 양식을 바꾸려면 이 파일이 아니라 템플릿을 고친다. 이 파일에 양식 내용을 복사해 두면 두 곳이 어긋나기 때문이다.

## 템플릿 선택

| 템플릿 | 언제 쓰는가 |
|---|---|
| `references/pr-template.ko.md` | 이 프로젝트 (현재 디렉토리가 `react-component-generator-leader` 저장소 안, 또는 `gh repo view` 의 저장소 이름이 `react-component-generator`) |
| `references/pr-template.en.md` | 그 외 모든 저장소 |

- 사용자가 PR 언어를 명시하면("영어로", "in English" 등) 그 언어의 템플릿이 위 규칙보다 우선한다.
- 선택한 템플릿의 언어로 PR 제목과 본문 전체를 쓴다. 템플릿은 한 가지만 읽는다.
- 새 언어가 필요하면 `references/pr-template.<언어코드>.md` 를 추가하고 위 표에 한 줄을 더한다.

## 절차

### 1. 사전 점검

아래를 병렬로 실행한다.

- `git branch --show-current` — 현재 브랜치
- `git status --short` — 커밋되지 않은 변경
- `gh repo view --json defaultBranchRef,url` — 기본 브랜치(base)와 저장소
- `gh pr list --head <현재 브랜치> --json url,state` — 이미 열린 PR

다음 경우에는 PR을 만들지 않고 이유를 보고한 뒤 종료한다.

- 현재 브랜치가 기본 브랜치다. PR은 작업 브랜치에서 만든다. 브랜치를 새로 만들지 말고 사용자에게 안내만 한다.
- 이미 같은 브랜치의 열린 PR이 있다. URL을 알려준다.
- base 대비 커밋이 없다 (`git log <base>..HEAD` 가 비어 있음).
- 커밋되지 않은 변경이 있다. PR에 포함되지 않으므로 커밋 여부를 사용자가 정하도록 알리고, 이를 제외한 나머지 PR 생성은 계속 진행한다.

### 2. 변경사항 분석

- `git log <base>..HEAD --format='%h %s%n%b'` — 커밋 목록과 본문
- `git diff <base>...HEAD --stat` 로 규모를 보고, 핵심 파일은 `git diff <base>...HEAD -- <파일>` 또는 Read로 내용을 확인한다. 파일 이름만 보고 판단하지 않는다. 무엇이 왜 바뀌었는지가 본문의 핵심이기 때문이다.
- 테스트 변경 여부를 Glob/Grep으로 확인하고, 실행 가능한 검증 명령(`package.json` scripts 등)을 파악한다.

### 3. 템플릿 적용

위 "템플릿 선택"에 따라 고른 파일을 `Read`로 읽고(`.claude/skills/create-pr/references/` 아래), 그 구조 그대로 본문을 채운다. 섹션을 임의로 추가·삭제하지 않는다. 해당 사항이 없는 섹션은 템플릿이 지정한 표기("해당 없음" 또는 "N/A")로 남기고, HTML 주석(`<!-- -->`)은 제거한다.

작성 원칙:

- 제목: 선택한 템플릿 언어로 `<type>: <요약>` (type은 feat/fix/refactor/chore), 70자 이내. 커밋이 하나면 그 메시지를 기준으로 삼고, 여러 개면 전체를 아우르는 하나의 목적으로 요약한다.
- 본문은 diff를 되풀이하지 않고 "왜 바꿨는지"와 리뷰어가 알아야 할 점을 쓴다.
- 확인하지 않은 것을 확인했다고 쓰지 않는다. 테스트 체크박스는 실제로 실행해 통과한 것만 체크한다. 가능하면 검증 명령을 실행하고, 실행하지 않았으면 체크하지 않는다.
- 비밀번호, API 키, 토큰, 개인정보 등은 본문에 넣지 않는다. diff에서 발견하면 값은 쓰지 말고 위치만 보고하고 PR 생성을 중단한다.
- 본문 마지막 줄에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)` 를 붙인다.

### 4. PR 생성

1. 현재 브랜치가 원격에 없거나 뒤처져 있으면 `git push -u origin <브랜치>` 로 올린다. force push는 하지 않는다.
2. 본문은 HEREDOC으로 넘긴다.

```bash
gh pr create --base <base> --title "<제목>" --body "$(cat <<'EOF'
<본문>
EOF
)"
```

3. 반환된 PR URL을 사용자에게 보고하고, 제목과 변경 요약을 한두 줄로 덧붙인다.

## 주의

- draft, reviewer, label 지정은 사용자가 요청한 경우에만 한다.
- 머지, 브랜치 삭제, 기존 PR 수정은 하지 않는다.
- 이 스킬은 사용자가 PR 생성을 요청해서 실행된 것이므로 생성 전 별도 확인은 받지 않는다. 대신 위 사전 점검에서 막힌 경우는 임의로 우회하지 말고 이유와 다음 행동을 알린다.
