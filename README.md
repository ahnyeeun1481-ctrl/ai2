# 공학자·소설 작가 포트폴리오

**라이브 사이트:** <https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev/>

공학 문제 해결 과정과 웹소설·전자책 활동을 소개하는 개인 포트폴리오입니다. 홈페이지는 Cloudflare Workers에서 제공하고, 방문자가 남긴 공개 방명록 댓글은 Cloudflare D1에 저장합니다.

## 주요 기능

- 소개, 공학 역량, 작가 활동과 작품 링크를 반응형 페이지로 제공합니다.
- 방명록 댓글은 모든 방문자에게 공개됩니다. 댓글 신고가 누적되면 자동으로 숨김 처리됩니다.
- 공유용 Open Graph/Twitter 메타데이터와 1200×630 PNG 이미지를 제공합니다.
- 로컬 콘텐츠 관리 도구로 프로필과 작품 정보를 편집할 수 있습니다.

## 방문 통계 설정 (GA4 / Google Tag Manager)

현재 저장소에는 GA4 Measurement ID나 GTM Container ID가 등록되어 있지 않습니다. 따라서 방문자 추적 태그는 아직 설치되지 않았고, Analytics 데이터도 수집되지 않습니다. 실제 계정에서 발급받은 ID와 데이터 수집 동의를 정하기 전에는 임시 ID를 넣지 않습니다.

### GA4 만들기

1. [Google Analytics](https://analytics.google.com/)의 **관리자 → 속성 만들기**에서 GA4 속성을 만듭니다.
2. **데이터 스트림 → 웹**에서 사이트 주소 `https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev/`를 등록합니다.
3. 웹 스트림 세부정보에서 `G-...` 형식의 Measurement ID를 복사합니다.

### Google Tag Manager 만들기

1. [Google Tag Manager](https://tagmanager.google.com/)에서 계정과 **Web** 컨테이너를 만듭니다.
2. 컨테이너 설치 화면의 `GTM-...` Container ID를 복사합니다.
3. GTM에 GA4 Google tag를 추가하고, 방아쇠를 모든 페이지뷰로 설정한 뒤 Preview에서 확인하고 Publish합니다.

ID를 저장소에 반영할 때는 `<head>`와 `<body>`에 Google이 안내하는 GTM 설치 코드를 넣고, 공개할 코드에 실제 ID가 포함되는지 검토합니다. ID는 비밀키는 아니지만, 소유하지 않은 속성 ID를 사용하면 다른 사람의 분석 데이터로 전송될 수 있으므로 본인 계정의 ID만 등록해야 합니다.

### 개인정보 동의와 데이터 수집

GA4/GTM을 추가하면 방문 데이터가 Google로 전송됩니다. 적용 지역과 사이트 운영 방식에 맞는 개인정보처리방침 및 동의 요구사항을 먼저 확인하세요. 동의 배너를 운영한다면 동의 전에는 필요한 태그를 차단하고, 이용자가 선택을 바꾸면 동의 상태를 갱신해야 합니다. Consent Mode는 동의 관리 자체를 대신하지 않습니다. 해당 지역의 법적 의무는 별도로 확인해야 합니다.

### 전환 목표

현재는 어떤 행동을 중요한 전환으로 볼지 정해져 있지 않아 전환 이벤트를 임의로 지정하지 않았습니다. 전환 목표를 정한 뒤 GA4/GTM에서 이벤트 이름과 조건을 만들고, 동의 설정과 함께 테스트하세요. 후보 행동은 이메일 문의 링크 클릭, GoodNovel/SSN 작품 링크 클릭, 방명록 댓글 게시, 관리자 로그인 등입니다. 댓글 본문·이메일 주소·관리자 토큰과 같은 개인정보나 비밀값은 이벤트에 포함하면 안 됩니다.

사이트는 여러 경로가 있는 앱이 아니라 단일 공개 홈페이지와 `noindex` 관리자 경로로 구성됩니다. 따라서 공개 페이지뷰는 홈 기준으로 수집하고, 의미 있는 상호작용은 명시적으로 선택한 이벤트로 측정합니다.

## 기술 구성

- HTML, CSS, 브라우저 JavaScript
- Cloudflare Workers 정적 자산 및 댓글 API
- Cloudflare D1 공개 댓글 데이터베이스
- Python 표준 `sqlite3` 기반 로컬 콘텐츠 관리자

로컬 SQLite와 공개 D1은 별도 데이터베이스입니다. 공개 사이트는 로컬 `portfolio.db`에 직접 연결하지 않습니다.

## 로컬 콘텐츠 편집

Windows에서 `start_admin.bat`을 실행한 뒤 <http://127.0.0.1:8765/>에 접속합니다. 프로필과 작품 정보를 수정하고 저장하면 이 PC의 `portfolio.db`에 기록됩니다. 공개 사이트에 반영할 콘텐츠 JSON은 관리자 화면에서 내보낼 수 있습니다.

이름·전공·관심 분야·문의 이메일은 실제 정보를 입력하기 전까지 사이트에 표시되지 않습니다. 공개 연락처가 필요하면 관리자에서 수신 가능한 이메일을 입력한 뒤 콘텐츠를 내보내 배포하세요.

## 배포

Wrangler가 대상 Cloudflare 계정에 로그인되어 있는지 확인하고, `wrangler.jsonc`의 Worker 및 D1 설정이 이 프로젝트를 가리키는지 검토합니다. 프로젝트 루트에서 다음 명령을 실행하면 공개 파일을 동기화하고 Worker를 배포합니다.

```bat
deploy_workers.bat
```

D1 스키마를 변경할 때는 기존 migration을 수정하지 말고 `worker/migrations/`에 새 번호의 파일을 추가합니다. 빈 로컬 DB에서 migration 전체를 먼저 확인한 뒤 원격에 적용합니다.

```powershell
wrangler d1 migrations apply portfolio-comments --local --config .\wrangler.jsonc
wrangler d1 migrations apply portfolio-comments --remote --config .\wrangler.jsonc
```

댓글 rate limit에 쓰는 `RATE_LIMIT_SALT`는 Wrangler Secret으로만 관리합니다. 비밀값을 코드나 문서에 넣지 마세요.

## Issues 및 기여

버그와 개선 요청은 [GitHub Issues](https://github.com/ahnyeeun1481-ctrl/ai2/issues)에 남겨 주세요. 재현 단계, 브라우저·기기, 기대한 결과와 실제 결과를 적으면 문제를 확인하는 데 도움이 됩니다.

배포 전에는 `node --check`로 JavaScript를 확인하고 `wrangler deploy --dry-run --config .\wrangler.jsonc`로 바인딩과 공개 자산을 점검합니다. 공개 폴더에 `portfolio.db`, 로컬 관리자 파일, 인증 정보나 Secret이 포함되지 않았는지도 확인하세요.

## 댓글과 개인정보

방명록 댓글은 방문자에게 공개됩니다. 닉네임이나 댓글에 이메일, 전화번호 등 민감한 정보를 쓰지 마세요. 작성 제한과 신고 후 자동 숨김 기능이 있지만, 모든 부적절한 내용을 자동으로 걸러내지는 못합니다. 로컬 `portfolio.db`와 Wrangler 인증 정보는 공개 저장소에 올리지 않습니다.

## 관련 파일

- `CONTENT_ADMIN.md` — 로컬 SQLite 콘텐츠 관리자 안내
- `worker/migrations/` — D1 스키마 변경 이력
- `worker/src/index.js` — Workers 댓글 API
- `wrangler.jsonc` — Worker, 정적 자산, D1 바인딩 설정