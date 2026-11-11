# 프로젝트 안내

**이 저장소는 반응형 개인 포트폴리오 웹사이트입니다.** 공개 사이트는 Cloudflare Workers에서 제공되며, 방명록 댓글은 Cloudflare D1에 저장됩니다.

- **라이브 사이트:** <https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev/>
- **개발 기준/문서 인덱스:** [AGENTS.md](../AGENTS.md)
- **제작·보안·배포:** [HARNESS.md](HARNESS.md)
- **QA와 GitHub 이슈:** [QA_AND_ISSUES.md](QA_AND_ISSUES.md)
- **SEO·검색 등록·공유 메타데이터:** [SEO_AND_METADATA.md](SEO_AND_METADATA.md)
- **성능 측정과 최적화:** [PERFORMANCE.md](PERFORMANCE.md)
- **GA4/GTM과 전환 이벤트:** [ANALYTICS.md](ANALYTICS.md)
- **로컬 콘텐츠 관리자 및 SQLite/D1:** [CONTENT_ADMIN.md](CONTENT_ADMIN.md)

## 로컬 실행 및 배포

- 웹 원본과 실행 스크립트는 프로젝트 루트에 있습니다. Cloudflare용 복사 배포 산출물은 `cloudflare-site/`에 생성됩니다.
- 로컬 SQLite 콘텐츠 관리자는 `start_admin.bat`을 실행합니다.
- Worker와 정적 공개 자산은 `deploy_workers.bat`으로 배포합니다.
- 배포 전에는 `harness\verify_workers.bat`을 실행하고, 실제 배포 후 공개 URL을 확인합니다.
- `portfolio.db`와 Cloudflare secret은 로컬/Cloudflare에만 보관하며 저장소에 커밋하지 않습니다.

이 저장소는 네이티브 iOS/Android 앱이 아니라 웹 프로젝트입니다. 반응형 UI, API/D1 데이터 흐름, 입력 검증·보안, 접근성, SEO, 성능 측정 및 배포 경험은 앱 개발에도 전이 가능한 역량으로 설명할 수 있습니다.