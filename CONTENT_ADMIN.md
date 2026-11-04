# SQLite 홈페이지 콘텐츠 관리자

## 설치 및 실행

- SQLite CLI: `sqlite3 --version`
- Windows에서 `start_admin.bat`을 실행합니다.
- 브라우저에서 `http://127.0.0.1:8765/`가 열립니다.
- 로컬 DB는 `portfolio.db`에 저장됩니다. 이 DB는 `.gitignore`로 Git 업로드에서 제외됩니다.

## 콘텐츠 수정 및 공개 사이트 반영

1. 관리 페이지에서 프로필 문구와 웹소설·전자책 링크를 수정하고 **SQLite에 저장**을 누릅니다.
2. **사이트 JSON 내보내기**를 눌러 `site-content.json`을 다운로드합니다.
3. 다운로드한 JSON을 저장소 루트의 `site-content.json`에 복사합니다.
4. `index.html`, `script.js`, `site-content.json`을 커밋하고 `main`에 푸시합니다.
5. GitHub Pages 배포가 완료되면 공개 홈페이지에 변경 내용이 반영됩니다.

기존 SQLite DB로 복원하려면 **SQLite DB 백업**으로 내려받은 파일을 프로젝트 루트의 `portfolio.db`에 놓습니다.
이 관리자 서버는 `127.0.0.1`에만 바인딩되며 인터넷에 공개되지 않습니다. GitHub Pages는 SQLite에 직접 연결하지 않고, 배포된 JSON을 읽습니다.