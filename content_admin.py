"""Local SQLite-backed content editor for the portfolio website."""

from __future__ import annotations

import json
import sqlite3
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "portfolio.db"
ADMIN_PATH = ROOT / "admin.html"
EXPORT_PATH = ROOT / "site-content.json"
HOST = "127.0.0.1"
PORT = 8765

DEFAULT_CONTENT = {
    "profile": {
        "name": "",
        "field": "",
        "focus": "",
        "email": "",
        "about_paragraph_1": "복잡한 문제를 만나면 먼저 현상을 살펴보고, 무엇이 핵심인지부터 생각합니다. 문제를 작은 단계로 나눈 뒤 가설을 세우고 직접 확인하면서, 근거에 맞는 답을 찾아갑니다.",
        "about_paragraph_2": "좋은 아이디어가 실제로 쓰이는 결과가 되려면 설계와 구현은 물론, 시험하고 고치는 과정도 중요하다고 생각합니다. 다른 사람의 의견을 듣고 함께 방법을 찾아가는 일도 제가 소중하게 여기는 과정입니다.",
        "writing_paragraph_1": "공학이 세상이 어떻게 움직이는지 살피는 일이라면, 글쓰기는 사람의 마음과 상상을 들여다보는 일이라고 생각합니다.",
        "writing_paragraph_2": "저는 인물들이 어떤 선택을 하고, 그 선택이 관계와 감정을 어떻게 바꾸는지 이야기로 풀어냅니다. 떠오른 장면을 한 문장씩 이어 붙이며, 읽는 분이 다음 이야기를 궁금해할 만한 세계를 만들어 갑니다.",
    },
    "works": [
        {"id": "webnovels", "kind": "웹소설", "platform": "GoodNovel", "title": "웹소설 작품 보러 가기", "url": "https://www.goodnovel.com/author/324108716", "sort_order": 1},
        {"id": "ebooks", "kind": "전자책", "platform": "SSN", "title": "전자책 작품 보러 가기", "url": "https://ssn.so/series/author/33793/", "sort_order": 2},
    ],
}


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_db() -> None:
    with connect_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT NOT NULL,
                field TEXT NOT NULL,
                focus TEXT NOT NULL,
                email TEXT NOT NULL DEFAULT '',
                about_paragraph_1 TEXT NOT NULL,
                about_paragraph_2 TEXT NOT NULL,
                writing_paragraph_1 TEXT NOT NULL,
                writing_paragraph_2 TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS works (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL,
                platform TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL CHECK(length(author) BETWEEN 1 AND 40),
                body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        profile = DEFAULT_CONTENT["profile"]
        columns = {row[1] for row in db.execute("PRAGMA table_info(profile)")}
        if "email" not in columns:
            db.execute("ALTER TABLE profile ADD COLUMN email TEXT NOT NULL DEFAULT ''")
        db.execute(
            """INSERT OR IGNORE INTO profile
               (id, name, field, focus, email, about_paragraph_1, about_paragraph_2,
                writing_paragraph_1, writing_paragraph_2)
               VALUES (1, :name, :field, :focus, :email, :about_paragraph_1,
                       :about_paragraph_2, :writing_paragraph_1, :writing_paragraph_2)""",
            profile,
        )
        db.executemany(
            """INSERT OR IGNORE INTO works (id, kind, platform, title, url, sort_order)
               VALUES (:id, :kind, :platform, :title, :url, :sort_order)""",
            DEFAULT_CONTENT["works"],
        )


def load_content() -> dict:
    with connect_db() as db:
        row = db.execute(
            """SELECT name, field, focus, email, about_paragraph_1, about_paragraph_2,
                      writing_paragraph_1, writing_paragraph_2
               FROM profile WHERE id = 1"""
        ).fetchone()
        works = db.execute(
            "SELECT id, kind, platform, title, url, sort_order FROM works ORDER BY sort_order, id"
        ).fetchall()
    return {"profile": dict(row), "works": [dict(work) for work in works]}


def export_content() -> dict:
    content = load_content()
    EXPORT_PATH.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return content


def save_content(data: dict) -> None:
    profile = data.get("profile")
    works = data.get("works")
    required_profile = set(DEFAULT_CONTENT["profile"])
    if not isinstance(profile, dict) or not required_profile.issubset(profile):
        raise ValueError("프로필 항목 형식을 확인해 주세요.")
    if not isinstance(works, list) or not works:
        raise ValueError("작품 링크를 한 개 이상 입력해 주세요.")
    for work in works:
        if not all(isinstance(work.get(key), str) and work[key].strip() for key in ("id", "kind", "platform", "title", "url")):
            raise ValueError("작품 종류, 플랫폼, 제목, URL은 비워둘 수 없습니다.")
        if not work["url"].startswith(("https://", "http://")):
            raise ValueError("작품 URL은 http:// 또는 https://로 시작해야 합니다.")

    with connect_db() as db:
        db.execute(
            """UPDATE profile SET name=:name, field=:field, focus=:focus, email=:email,
               about_paragraph_1=:about_paragraph_1,
               about_paragraph_2=:about_paragraph_2,
               writing_paragraph_1=:writing_paragraph_1,
               writing_paragraph_2=:writing_paragraph_2,
               updated_at=CURRENT_TIMESTAMP WHERE id=1""",
            {key: str(profile[key]).strip() for key in required_profile},
        )
        db.execute("DELETE FROM works")
        db.executemany(
            """INSERT INTO works (id, kind, platform, title, url, sort_order)
               VALUES (:id, :kind, :platform, :title, :url, :sort_order)""",
            [
                {
                    "id": str(work["id"]).strip(),
                    "kind": str(work["kind"]).strip(),
                    "platform": str(work["platform"]).strip(),
                    "title": str(work["title"]).strip(),
                    "url": str(work["url"]).strip(),
                    "sort_order": int(work.get("sort_order", index)),
                }
                for index, work in enumerate(works, start=1)
            ],
        )
    export_content()


def sanitize_comment_text(value: str) -> str:
    import re

    value = re.sub(r"<[^>]*>", "", value)
    value = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    value = value.replace('"', "&quot;").replace("'", "&#39;")
    return re.sub(r"\n{3,}", "\n\n", value.replace("\r\n", "\n").replace("\r", "\n")).strip()


class Handler(BaseHTTPRequestHandler):
    server_version = "PortfolioContentAdmin/1.0"

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/", "/admin"):
            if not ADMIN_PATH.exists():
                self._send(404, b"admin.html is missing", "text/plain; charset=utf-8")
                return
            self._send(200, ADMIN_PATH.read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/content":
            body = json.dumps(load_content(), ensure_ascii=False).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
        elif path == "/api/export":
            content = export_content()
            body = json.dumps(content, ensure_ascii=False, indent=2).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
        elif path == "/api/database":
            self._send(200, DB_PATH.read_bytes(), "application/octet-stream")
        elif path == "/api/comments":
            with connect_db() as db:
                rows = db.execute(
                    "SELECT id, author, body, created_at FROM comments ORDER BY id DESC LIMIT 100"
                ).fetchall()
            body = json.dumps([dict(row) for row in rows], ensure_ascii=False).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
        else:
            self._send(404, b"Not found", "text/plain; charset=utf-8")

    def do_PUT(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/api/content":
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 1_000_000:
                raise ValueError("요청이 너무 큽니다.")
            save_content(json.loads(self.rfile.read(length).decode("utf-8")))
            body = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            body = json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False).encode("utf-8")
            self._send(400, body, "application/json; charset=utf-8")

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/api/comments":
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 10_000:
                raise ValueError("댓글 요청이 너무 큽니다.")
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            author = sanitize_comment_text(str(data.get("author", ""))).replace("\n", " ")
            body = sanitize_comment_text(str(data.get("body", "")))
            if not author or len(author) > 40:
                raise ValueError("닉네임은 1~40자로 입력해 주세요.")
            if not body or len(body) > 1000:
                raise ValueError("댓글은 1~1000자로 입력해 주세요.")
            with connect_db() as db:
                cursor = db.execute("INSERT INTO comments (author, body) VALUES (?, ?)", (author, body))
                row = db.execute(
                    "SELECT id, author, body, created_at FROM comments WHERE id=?", (cursor.lastrowid,)
                ).fetchone()
            response = json.dumps(dict(row), ensure_ascii=False).encode("utf-8")
            self._send(201, response, "application/json; charset=utf-8")
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            response = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self._send(400, response, "application/json; charset=utf-8")

    def do_DELETE(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if not path.startswith("/api/comments/"):
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        try:
            comment_id = int(path.rsplit("/", 1)[-1])
            with connect_db() as db:
                cursor = db.execute("DELETE FROM comments WHERE id=?", (comment_id,))
            self._send(200 if cursor.rowcount else 404, b'{"ok":true}', "application/json; charset=utf-8")
        except ValueError:
            self._send(400, b'{"error":"Invalid comment id"}', "application/json; charset=utf-8")

    def log_message(self, fmt: str, *args) -> None:
        print(f"[local admin] {self.address_string()} - {fmt % args}")


if __name__ == "__main__":
    initialize_db()
    export_content()
    url = f"http://{HOST}:{PORT}/"
    print(f"SQLite database: {DB_PATH}")
    print(f"Local content editor: {url}")
    print("This editor only listens on this computer; it does not publish the database.")
    webbrowser.open(url)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()