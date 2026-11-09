# 공학자·소설 작가 포트폴리오

**라이브 사이트:** <https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev/>

공학 문제 해결 과정과 웹소설·전자책 활동을 소개하는 개인 포트폴리오입니다. 정적 사이트는 Cloudflare Workers에서 제공하고, 공개 방명록 댓글은 Cloudflare D1에 저장합니다.

## 주요 기능

- 반응형 소개, 공학 역량, 작가 활동 및 작품 링크
- 공개 방명록: 모든 방문자가 볼 수 있으며 Cloudflare D1에 저장
- 댓글 신고와 반복 신고 댓글 자동 숨김
- Open Graph/Twitter 공유 메타데이터와 1200×630 PNG 미리보기 이미지
- 로컬 콘텐츠 편집 도구와 SQLite 데이터베이스

## 기술 구성

- HTML, CSS, 브라우저 JavaScript
- Cloudflare Workers 정적 자산과 댓글 API
- Cloudflare D1 공개 댓글 데이터베이스
- Python 표준 `sqlite3` 기반 로컬 콘텐츠 관리자
- SQLite CLI는 개발·점검용입니다. 공개 Worker는 로컬 SQLite 파일에 연결하지 않습니다.

## 로컬 콘텐츠 편집

Windows에서 `start_admin.bat`을 실행하고 <http://127.0.0.1:8765/>에서 프로필과 작품 정보를 편집합니다. 데이터는 로컬 `portfolio.db`에 저장됩니다. 공개 댓글의 D1 데이터와는 별도이며 자동 동기화되지 않습니다.

콘텐츠를 공개하려면 관리자에서 `site-content.json`을 내보내 저장소 루트에 반영한 후 Worker를 다시 배포합니다. 공개 문의 이메일은 실제 주소를 입력하기 전까지 표시되지 않습니다.

## Cloudflare Workers 배포

배포 전 Wrangler에 대상 Cloudflare 계정으로 로그인하고, 설정 파일의 Worker/D1 리소스가 해당 프로젝트와 일치하는지 확인합니다. 그런 다음 프로젝트 루트에서 실행합니다.

```bat
deploy_workers.bat
```

이 스크립트는 정적 파일과 OG PNG를 `cloudflare-site/`에 동기화한 뒤 `wrangler.jsonc` 설정으로 배포합니다. D1 스키마 변경은 `worker/migrations/`에 새 순번 migration으로 추가하고, 먼저 로컬에서 검증한 다음 원격에 적용합니다.

```powershell
wrangler d1 migrations apply portfolio-comments --local --config .\wrangler.jsonc
wrangler d1 migrations apply portfolio-comments --remote --config .\wrangler.jsonc
```

댓글 rate-limit용 `RATE_LIMIT_SALT`는 Wrangler Secret으로 보관합니다. 비밀값을 소스 코드나 문서에 넣지 마세요.

## Issues와 기여

버그 제보와 개선 요청은 [GitHub Issues](https://github.com/ahnyeeun1481-ctrl/ai2/issues)에 남겨 주세요. 재현 단계, 사용 기기·브라우저, 기대 결과와 실제 결과를 함께 적으면 확인에 도움이 됩니다. 변경 사항은 작은 단위로 제출하고, 배포 전 `harness/verify_workers.bat`의 체크 항목을 확인하세요.

## 프로젝트 문서

- [SQLite 콘텐츠 관리자 안내](./CONTENT_ADMIN.md)
- `harness/HARNESS.md`: 코드 작성·보안·테스트·배포 하네스
- `worker/migrations/`: D1 스키마 변경 이력
- `wrangler.jsonc`: Worker 정적 자산과 D1 바인딩 설정

## 데이터·개인정보 안내

공개 방명록 댓글은 방문자에게 표시됩니다. 닉네임이나 댓글에 이메일, 전화번호 등 민감한 개인정보를 입력하지 마세요. 작성 제한과 신고 기능이 있지만 자동 필터링이 모든 부적절한 내용을 막는 것은 아닙니다. 로컬 `portfolio.db`, Wrangler 인증 정보와 Secret은 공개 저장소에 올리지 않습니다.