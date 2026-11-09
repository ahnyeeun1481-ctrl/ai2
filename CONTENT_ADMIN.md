# SQLite 홈페이지 콘텐츠 관리자

프로젝트의 공통 제작·보안·검증·배포 규칙은 [`harness/HARNESS.md`](harness/HARNESS.md)에 정리되어 있습니다. 변경 전후 체크리스트와 비배포 dry-run 검증은 `harness/verify_workers.bat`을 참고하세요.

## 설치 및 실행

- SQLite CLI: `sqlite3 --version`
- Windows에서 `start_admin.bat`을 실행합니다.
- 브라우저에서 `http://127.0.0.1:8765/`가 열립니다.
- 로컬 DB는 `portfolio.db`에 저장됩니다. 이 DB는 `.gitignore`로 Git 업로드에서 제외됩니다.

## 로컬 콘텐츠 수정 및 공개 사이트 반영

1. 관리 페이지에서 프로필 문구와 웹소설·전자책 링크를 수정하고 **SQLite에 저장**을 누릅니다.
2. **사이트 JSON 내보내기**를 눌러 `site-content.json`을 다운로드합니다.
3. 다운로드한 JSON을 저장소 루트의 `site-content.json`에 복사합니다.
4. 프로젝트 루트에서 `deploy_workers.bat`을 실행합니다. 이 스크립트가 JSON, OG PNG와 공개 파일을 자동 동기화합니다.

기존 SQLite DB로 복원하려면 **SQLite DB 백업**으로 내려받은 파일을 프로젝트 루트의 `portfolio.db`에 놓습니다.
이 관리 서버는 `127.0.0.1`에만 바인딩되며 인터넷에 공개되지 않습니다. 공개 홈페이지는 SQLite 대신 `cloudflare-site/site-content.json`을 읽습니다.

## 공개 댓글과 D1

- 공개 댓글은 Cloudflare Worker의 `/api/comments` API를 통해 원격 D1 데이터베이스에 저장됩니다.
- 로컬 `portfolio.db`의 댓글과 원격 D1 댓글은 서로 다른 저장소이며 자동 동기화되지 않습니다.
- 공개 댓글은 1시간 기준 IP 해시별 10개 제한이 적용됩니다. IP 원문 대신 Cloudflare Secret `RATE_LIMIT_SALT`를 적용한 해시만 저장합니다.
- 공개 댓글 제출은 Cloudflare Turnstile 토큰이 필요합니다. Worker는 Siteverify에서 토큰 성공·hostname을 확인하며, 검증 서비스나 Secret을 사용할 수 없으면 댓글 등록을 거부합니다.
- Turnstile sitekey는 `index.html`/`script.js`의 공개 키이고, secret key는 Worker Secret `TURNSTILE_SECRET_KEY`로만 저장합니다. 절대 secret을 HTML/JS/README에 넣지 않습니다.
- 신고 버튼으로 신고할 수 있으며 3회 신고된 댓글은 자동 숨김됩니다. `/admin`의 인증된 원격 관리자 화면에서는 댓글을 숨김·복구·영구 삭제할 수 있습니다.
- 허용된 브라우저 origin은 `wrangler.jsonc`의 `SITE_ORIGIN`만 사용하며, 다른 origin의 preflight 요청은 거부합니다.
- D1/Workers 댓글과 로컬 SQLite 댓글은 서로 다른 저장소입니다. `/admin`은 원격 D1 댓글을 관리하며, 로컬 SQLite 댓글과 자동 동기화되지 않습니다.
- `RATE_LIMIT_SALT`는 Worker Secret으로 설정하며, 공개 코드나 `wrangler.jsonc`에 값을 기록하지 않습니다.
- 원격 관리자 로그인 토큰은 `ADMIN_TOKEN` Worker Secret입니다. 최초 설정 또는 교체는 `./set_admin_token.ps1`을 실행합니다. 스크립트는 새 강한 토큰을 생성해 Cloudflare Secret으로 보내고 클립보드에 복사하지만 프로젝트 파일에는 저장하지 않습니다. `/admin`에서 로그인한 뒤 비밀번호 관리자에 안전하게 저장하세요.
- `/api/admin/*` 요청은 `Authorization: Bearer` 토큰이 없거나 틀리면 거부됩니다. 관리자 UI는 `/admin` 경로에서 제공되며 검색 엔진 색인은 차단됩니다. URL 은닉은 인증 수단이 아닙니다.
- 배포 전 스키마 변경은 `worker/migrations/`에 새 순번 migration을 추가하고 다음 명령으로 적용합니다:

  ```powershell
  wrangler d1 migrations apply portfolio-comments --remote
  ```

- `deploy_workers.bat`은 배포 전에 최신 정적 파일을 `cloudflare-site/`로 동기화하고 Worker를 배포합니다.

카카오톡 링크 미리보기는 OG 데이터를 캐시할 수 있습니다. OG 이미지가 바뀐 뒤에도 예전 이미지가 보이면 카카오 링크 캐시를 갱신하거나 OG 이미지 URL에 새 버전 쿼리/파일명을 적용합니다.