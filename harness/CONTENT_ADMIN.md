# SQLite 홈페이지 콘텐츠 관리자

공통 제작·보안·검증·배포 절차는 [웹사이트 하네스](HARNESS.md), 저장소 전체 규칙은 [AGENTS.md](../AGENTS.md)를 참고하세요.

## 설치 및 실행

- SQLite CLI는 `sqlite3 --version`으로 확인합니다.
- Windows에서 프로젝트 루트의 `start_admin.bat`을 실행하면 로컬 관리자 페이지가 열립니다.
- 기본 주소는 `http://127.0.0.1:8765/`입니다. 서버는 loopback 주소에만 바인딩되므로 인터넷에 공개되지 않습니다.
- SQLite DB는 프로젝트 루트의 `portfolio.db`에 저장되며 `.gitignore`로 Git에서 제외됩니다.

## 로컬 콘텐츠 수정 및 공개 반영

1. 관리자에서 프로필 문구와 웹소설·전자책 링크를 편집하고 SQLite에 저장합니다.
2. 사이트 JSON을 내보내 `site-content.json`에 저장합니다.
3. 변경 내용을 검토하고 `deploy_workers.bat`으로 공개 자산을 동기화·배포합니다.
4. 공개 페이지와 콘텐츠 JSON을 실제 URL에서 확인합니다.

공개 페이지는 로컬 SQLite에 직접 연결되지 않습니다. 로컬 DB와 배포된 JSON은 별도이므로, JSON 내보내기 및 배포 전에는 실제 공개할 정보인지 검토하세요. SQLite 복원 시 백업 파일을 프로젝트 루트의 `portfolio.db`에 둡니다.

## 공개 댓글과 Cloudflare D1

- 방문자 댓글은 Cloudflare Worker의 `/api/comments`를 거쳐 원격 D1에 저장됩니다. 댓글은 모든 방문자에게 공개됩니다.
- 로컬 SQLite 댓글과 원격 D1 댓글은 별도 저장소이며 자동 동기화되지 않습니다.
- 댓글은 입력 길이 제한, HTML 정리, Turnstile 검증, rate limiting을 거칩니다. 원시 IP 주소 대신 secret-salted 해시를 사용합니다.
- 댓글 신고와 자동 숨김이 있으며, 인증된 원격 관리자 화면에서 댓글을 숨기거나 복구·삭제할 수 있습니다.
- 관리자 토큰은 `ADMIN_TOKEN` Worker Secret으로만 관리합니다. `set_admin_token.ps1`은 토큰을 생성해 Cloudflare에 설정하고 클립보드에 복사하므로, 안전한 기기에서 실행하고 공유된 클립보드/콘솔에 노출하지 마세요.
- `RATE_LIMIT_SALT`와 `TURNSTILE_SECRET_KEY`도 Worker Secret입니다. 비밀값을 HTML, JavaScript, Wrangler 설정, README, Git에 넣지 않습니다.
- D1 스키마 변경은 순번 migration으로 추가하고, 새 로컬 DB에서 전체 migration 체인을 검증한 후 승인된 경우에만 원격 적용합니다.