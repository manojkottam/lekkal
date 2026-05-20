// Lekkal Worker — serves static assets + email-capture API
// Bindings: ASSETS (static assets), DB (D1)
// Secrets:  ADMIN_PASSWORD (for /api/admin/list)

const RATE_WINDOW_MS = 60_000;   // 1 minute
const RATE_MAX_HITS  = 5;        // max requests per IP per window
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age":       "86400",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight for /api routes
    if (url.pathname.startsWith("/api/") && request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // Subscribe
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env);
    }

    // Unsubscribe (clickable from emails)
    if (url.pathname === "/api/unsubscribe" && request.method === "GET") {
      return handleUnsubscribe(url, env);
    }

    // Admin list (basic auth)
    if (url.pathname === "/api/admin/list" && request.method === "GET") {
      return handleAdminList(request, env);
    }

    // Admin CSV export
    if (url.pathname === "/api/admin/export.csv" && request.method === "GET") {
      return handleAdminExport(request, env);
    }

    // Everything else: static assets (or 404)
    return env.ASSETS.fetch(request);
  },
};

// ============================================================
// /api/subscribe
// ============================================================
async function handleSubscribe(request, env) {
  try {
    const data = await readBody(request);

    // Honeypot — bots fill this field, real users never see it
    if (data.website && String(data.website).length > 0) {
      // Pretend success so bots don't retry
      return json({ ok: true }, 200);
    }

    const email  = String(data.email  || "").trim().toLowerCase();
    const source = String(data.source || "unknown").slice(0, 100);

    if (!isValidEmail(email)) {
      return json({ ok: false, error: "Please enter a valid email." }, 400);
    }

    // Rate limit per IP
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const allowed = await checkRateLimit(env.DB, ip);
    if (!allowed) {
      return json({ ok: false, error: "Too many requests. Try again in a minute." }, 429);
    }

    const country   = request.cf?.country || "";
    const userAgent = (request.headers.get("User-Agent") || "").slice(0, 200);
    const token     = crypto.randomUUID();

    try {
      await env.DB.prepare(
        `INSERT INTO subscribers (email, source, user_agent, ip_country, created_at, unsubscribe_token)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      ).bind(email, source, userAgent, country, Date.now(), token).run();
    } catch (e) {
      // Duplicate email: return success (don't leak whether the email exists)
      if (/UNIQUE/i.test(e.message)) {
        return json({ ok: true, alreadySubscribed: true }, 200);
      }
      throw e;
    }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: "Server error. Please try again." }, 500);
  }
}

// ============================================================
// /api/unsubscribe?token=...
// ============================================================
async function handleUnsubscribe(url, env) {
  const token = url.searchParams.get("token");
  if (!token) {
    return htmlPage("Missing token", "This unsubscribe link is invalid.", 400);
  }
  const result = await env.DB.prepare(
    `UPDATE subscribers SET unsubscribed = 1, unsubscribed_at = ?1 WHERE unsubscribe_token = ?2`
  ).bind(Date.now(), token).run();
  if (result.meta.changes === 0) {
    return htmlPage("Already removed", "This token isn't on our list, or you've already unsubscribed.", 404);
  }
  return htmlPage("You're unsubscribed", "We won't email you again. The tools are still free to use.", 200);
}

// ============================================================
// /api/admin/list — basic auth, JSON
// ============================================================
async function handleAdminList(request, env) {
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  const results = await env.DB.prepare(
    `SELECT id, email, source, ip_country, created_at, unsubscribed
     FROM subscribers
     ORDER BY created_at DESC
     LIMIT 1000`
  ).all();

  // Quick stats
  const totals = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN unsubscribed = 0 THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) AS unsubscribed
     FROM subscribers`
  ).first();

  return json({
    stats: totals,
    subscribers: results.results,
  }, 200, false);
}

// ============================================================
// /api/admin/export.csv — basic auth, CSV download
// ============================================================
async function handleAdminExport(request, env) {
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  const results = await env.DB.prepare(
    `SELECT email, source, ip_country, created_at, unsubscribed
     FROM subscribers
     ORDER BY created_at DESC`
  ).all();

  const header = "email,source,country,signup_iso,unsubscribed";
  const rows = results.results.map(r => [
    csvEscape(r.email),
    csvEscape(r.source),
    csvEscape(r.ip_country),
    csvEscape(new Date(r.created_at).toISOString()),
    r.unsubscribed ? "1" : "0",
  ].join(","));
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type":       "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lekkal-subscribers-${Date.now()}.csv"`,
    },
  });
}

// ============================================================
// Helpers
// ============================================================
async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await request.json();
  }
  const fd = await request.formData();
  const out = {};
  for (const [k, v] of fd.entries()) out[k] = v;
  return out;
}

function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function checkRateLimit(db, ip) {
  const now = Date.now();
  const row = await db.prepare(
    `SELECT count, window_start FROM rate_limits WHERE ip = ?1`
  ).bind(ip).first();

  if (!row) {
    await db.prepare(
      `INSERT INTO rate_limits (ip, count, window_start) VALUES (?1, 1, ?2)`
    ).bind(ip, now).run();
    return true;
  }

  if (now - row.window_start > RATE_WINDOW_MS) {
    await db.prepare(
      `UPDATE rate_limits SET count = 1, window_start = ?1 WHERE ip = ?2`
    ).bind(now, ip).run();
    return true;
  }

  if (row.count >= RATE_MAX_HITS) return false;

  await db.prepare(
    `UPDATE rate_limits SET count = count + 1 WHERE ip = ?1`
  ).bind(ip).run();
  return true;
}

function checkAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Basic ")) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Lekkal Admin"' },
    });
  }
  let user = "", pass = "";
  try {
    [user, pass] = atob(auth.slice(6)).split(":");
  } catch { /* fall through */ }
  if (user !== "admin" || !env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

function json(obj, status = 200, withCors = true) {
  const headers = { "Content-Type": "application/json" };
  if (withCors) Object.assign(headers, CORS);
  return new Response(JSON.stringify(obj), { status, headers });
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function htmlPage(title, message, status) {
  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — Lekkal</title>
<link rel="stylesheet" href="/styles.css" />
</head><body>
<nav class="top"><div class="inner"><a href="/" class="brand" style="text-decoration:none;"><div class="mark">L</div><div class="name">Lekkal</div></a></div></nav>
<section class="wrap tool-hero">
  <h1>${title}</h1>
  <p>${message}</p>
  <p style="margin-top: 20px;"><a href="/" class="btn btn-large">Back to Lekkal →</a></p>
</section>
</body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" }});
}
