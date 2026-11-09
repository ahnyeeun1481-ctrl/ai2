const MAX_BODY_BYTES = 10_000;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const REPORT_LIMIT = 3;
const COMMENT_PAGE_SIZE = 5;
const TURNSTILE_MAX_TOKEN_LENGTH = 2048;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev",
  "https://ahnyeeun1481-ctrl.github.io",
];
const securityPolicy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https://challenges.cloudflare.com https://*.google-analytics.com https://*.googletagmanager.com https://ssl.gstatic.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://tagmanager.google.com; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://*.googletagmanager.com https://tagmanager.google.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://ahnyeeun-portfolio.ahnyeeun1481.workers.dev https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; upgrade-insecure-requests";

function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Content-Security-Policy", securityPolicy);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status = 200, origin = null, originAllowlist = DEFAULT_ALLOWED_ORIGINS) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  const originAllowed = Boolean(origin) && (originAllowlist instanceof Set ? originAllowlist.has(origin) : originAllowlist.includes(origin));
  if (originAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return applySecurityHeaders(new Response(JSON.stringify(data), { status, headers }));
}

async function hashAddress(address, secret) {
  const bytes = new TextEncoder().encode(`${secret}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

async function readJsonLimited(request) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new RangeError("요청이 너무 큽니다.");
  if (!request.body) throw new TypeError("요청 본문이 비어 있습니다.");
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("요청이 너무 큽니다.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function escapeCommentText(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeComment(value) {
  const lineFeed = String.fromCharCode(10);
  const carriageReturn = String.fromCharCode(13);
  let collapsedNewlines = String(value)
    .split(carriageReturn + lineFeed).join(lineFeed)
    .split(carriageReturn).join(lineFeed);
  const threeLineFeeds = lineFeed.repeat(3);
  const twoLineFeeds = lineFeed.repeat(2);
  while (collapsedNewlines.includes(threeLineFeeds)) {
    collapsedNewlines = collapsedNewlines.split(threeLineFeeds).join(twoLineFeeds);
  }
  return escapeCommentText(collapsedNewlines).trim();
}


async function verifyTurnstile(token, request, env) {
  if (typeof token !== "string" || token.length < 1 || token.length > MAX_TURNSTILE_TOKEN_LENGTH) return false;
  if (!env.TURNSTILE_SECRET_KEY) return false;
  const form = new URLSearchParams();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && result.hostname === "ahnyeeun-portfolio.ahnyeeun1481.workers.dev";
  } catch {
    return false;
  }
}

function constantTimeEquals(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isAdmin(request, env) {
  const token = env.ADMIN_TOKEN;
  const authorization = request.headers.get("Authorization") || "";
  if (!token || token.length < 32 || !authorization.startsWith("Bearer ")) return false;
  return constantTimeEquals(authorization.slice(7), token);
}

function commentRateLimitResponse(origin, retryAfterSeconds, allowedOrigins) {
  const response = json({ error: `댓글은 분당 3개까지 작성할 수 있습니다. ${retryAfterSeconds}초 후 다시 시도해 주세요.` }, 429, origin, allowedOrigins);
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

function requireAdmin(request, env, origin, allowedOrigins) {
  return isAdmin(request, env) ? null : json({ error: "인증이 필요합니다." }, 401, origin, allowedOrigins);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigins = new Set([
      env.SITE_ORIGIN || url.origin,
      ...DEFAULT_ALLOWED_ORIGINS,
      ...(env.ADDITIONAL_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean),
    ]);
    const originAllowed = !origin || allowedOrigins.has(origin);
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      const adminUrl = new URL("/admin.html", request.url);
      const response = await env.ASSETS.fetch(new Request(adminUrl, { method: "GET", headers: request.headers }));
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return applySecurityHeaders(new Response(response.body, { status: response.status, headers }));
    }
    if (url.pathname === "/api/admin/session") {
      if (request.method !== "POST") return json({ error: "허용되지 않은 요청입니다." }, 405, origin, allowedOrigins);
      if (!originAllowed) return json({ error: "허용되지 않은 출처입니다." }, 403, origin, allowedOrigins);
      return isAdmin(request, env) ? json({ ok: true }, 200, origin, allowedOrigins) : json({ error: "관리자 토큰이 올바르지 않습니다." }, 401, origin, allowedOrigins);
    }
    if (url.pathname.startsWith("/api/admin/")) {
      const authError = requireAdmin(request, env, origin, allowedOrigins);
      if (authError) return authError;
      if (url.pathname === "/api/admin/content" && request.method === "GET") {
        const row = await env.DB.prepare("SELECT value FROM site_content WHERE id = 1").first();
        return json(row ? JSON.parse(row.value) : null, 200, origin, allowedOrigins);
      }
      if (url.pathname === "/api/admin/content" && request.method === "PUT") {
        let content;
        try { content = await readJsonLimited(request); }
        catch { return json({ error: "JSON 또는 요청 크기를 확인해 주세요." }, 400, origin, allowedOrigins); }
        if (!content || typeof content !== "object" || !content.profile || !Array.isArray(content.works)) {
          return json({ error: "콘텐츠 JSON 형식이 올바르지 않습니다." }, 400, origin, allowedOrigins);
        }
        await env.DB.prepare("INSERT INTO site_content (id, value, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP")
          .bind(JSON.stringify(content)).run();
        return json({ ok: true }, 200, origin, allowedOrigins);
      }
      if (url.pathname === "/api/admin/comments" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT id, author, body, created_at, report_count, is_hidden FROM comments ORDER BY id DESC LIMIT 500").all();
        return json(results, 200, origin, allowedOrigins);
      }
      const commentAction = url.pathname.match(/^\/api\/admin\/comments\/(\d+)\/(hide|restore|delete)$/);
      if (commentAction && request.method === "POST") {
        const id = Number(commentAction[1]);
        const action = commentAction[2];
        if (action === "delete") await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
        else await env.DB.prepare("UPDATE comments SET is_hidden = ? WHERE id = ?").bind(action === "hide" ? 1 : 0, id).run();
        return json({ ok: true }, 200, origin, allowedOrigins);
      }
      return json({ error: "관리자 경로를 찾을 수 없습니다." }, 404, origin, allowedOrigins);
    }
      if (url.pathname === "/api/comments") {
      if (request.method === "OPTIONS") {
        if (origin && !allowedOrigins.has(origin)) return json({ error: "허용되지 않은 출처입니다." }, 403, origin, allowedOrigins);
        const headers = new Headers({
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        });
        if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
        return applySecurityHeaders(new Response(null, { status: 204, headers }));
      }
      if (origin && !allowedOrigins.has(origin)) return json({ error: "허용되지 않은 출처입니다." }, 403, origin, allowedOrigins);
      if (request.method === "GET") {
        const limit = COMMENT_PAGE_SIZE;
        const offset = Math.max(0, Math.min(10_000, Number(url.searchParams.get("offset")) || 0));
        const { results } = await env.DB.prepare(
          "SELECT id, author, body, created_at, report_count FROM comments WHERE is_hidden = 0 ORDER BY id DESC LIMIT ? OFFSET ?",
        ).bind(limit + 1, offset).all();
        const hasMore = results.length > limit;
        const page = results.slice(0, limit).map((comment) => ({
          ...comment,
          author: sanitizeComment(comment.author).replace(/\n/g, " "),
          body: sanitizeComment(comment.body),
        }));
        return json({ items: page, hasMore, nextOffset: offset + page.length }, 200, origin, allowedOrigins);
      }
      if (request.method === "POST") {
        let data;
        try {
          data = await readJsonLimited(request);
        } catch (error) {
          return json({ error: error instanceof RangeError ? error.message : "JSON 요청을 확인해 주세요." }, error instanceof RangeError ? 413 : 400, origin, allowedOrigins);
        }
        if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "요청 형식이 올바르지 않습니다." }, 400, origin, allowedOrigins);
        const author = typeof data.author === "string" ? sanitizeComment(data.author).replace(/\n/g, " ") : "";
        const body = typeof data.body === "string" ? sanitizeComment(data.body) : "";
        if (author.length < 1 || author.length > 40) return json({ error: "닉네임은 1~40자로 입력해 주세요." }, 400, origin, allowedOrigins);
        if (body.length < 1 || body.length > 1000) return json({ error: "댓글은 1~1,000자로 입력해 주세요." }, 400, origin, allowedOrigins);
        if (!(await verifyTurnstile(data.turnstileToken, request, env))) {
          return json({ error: "봇 확인에 실패했습니다. 확인을 다시 완료해 주세요." }, 403, origin, allowedOrigins);
        }

        const address = request.headers.get("CF-Connecting-IP") || "unknown";
        const salt = env.RATE_LIMIT_SALT;
        if (!salt || salt.length < 32) return json({ error: "댓글 API 설정이 완료되지 않았습니다." }, 503, origin, allowedOrigins);
        const ipHash = await hashAddress(address, salt);
        const minuteRecent = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM comments WHERE ip_hash = ? AND created_at >= datetime('now', '-1 minute')",
        ).bind(ipHash).first();
        if (minuteRecent.count >= 3) return commentRateLimitResponse(origin, 60, allowedOrigins);
        const recent = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM comments WHERE ip_hash = ? AND created_at >= datetime('now', '-1 hour')",
        ).bind(ipHash).first();
        if (recent.count >= 10) return json({ error: "한 시간 댓글 작성 한도(10개)에 도달했습니다." }, 429, origin, allowedOrigins);

        const inserted = await env.DB.prepare(
          "INSERT INTO comments (author, body, ip_hash) VALUES (?, ?, ?) RETURNING id, author, body, created_at",
        ).bind(author, body, ipHash).first();
        return json(inserted, 201, origin, allowedOrigins);
      }
      return json({ error: "허용되지 않은 요청입니다." }, 405, origin, allowedOrigins);
    }
    const reportMatch = url.pathname.match(/^\/api\/comments\/(\d+)\/report$/);
    if (reportMatch) {
      if (request.method !== "POST") return json({ error: "허용되지 않은 요청입니다." }, 405, origin, allowedOrigins);
      if (!originAllowed) return json({ error: "허용되지 않은 출처입니다." }, 403, origin, allowedOrigins);
      const salt = env.RATE_LIMIT_SALT;
      if (!salt || salt.length < 32) return json({ error: "댓글 API 설정이 완료되지 않았습니다." }, 503, origin, allowedOrigins);
      const address = request.headers.get("CF-Connecting-IP") || "unknown";
      const reporterHash = await hashAddress(address, salt);
      const commentId = Number(reportMatch[1]);
      const report = await env.DB.prepare(
        "INSERT OR IGNORE INTO comment_reports (comment_id, reporter_hash) SELECT id, ? FROM comments WHERE id = ? AND is_hidden = 0",
      ).bind(reporterHash, commentId).run();
      if (!report.meta.changes) return json({ error: "이미 신고했거나 댓글을 찾을 수 없습니다." }, 409, origin, allowedOrigins);
      await env.DB.batch([
        env.DB.prepare("UPDATE comments SET report_count = report_count + 1 WHERE id = ?").bind(commentId),
        env.DB.prepare("UPDATE comments SET is_hidden = 1 WHERE id = ? AND report_count >= ?").bind(commentId, REPORT_LIMIT),
      ]);
      return json({ ok: true, hiddenAtLimit: REPORT_LIMIT }, 201, origin, allowedOrigins);
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "찾을 수 없습니다." }, 404, origin, allowedOrigins);
    const assetResponse = await env.ASSETS.fetch(request);
    const assetHeaders = new Headers(assetResponse.headers);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/" || pathname.endsWith(".html") || pathname.endsWith(".json") || pathname.endsWith(".xml")) {
      assetHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
    } else if (/\.(?:css|js|png|svg|ico|woff2?)$/i.test(pathname)) {
      assetHeaders.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    }
    return applySecurityHeaders(new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers: assetHeaders }));
  },
};