/**
 * Seedance Worker：静态资源托管 + API 反向代理（解决浏览器 CORS）+ 临时图床。
 * - /proxy/*  转发到 API_UPSTREAM
 * - /upload   上传参考图/视频到 R2，返回可公网访问的 /files/<key> 链接
 * - /files/*  公网读取 R2 对象（供 Seedance 后端拉取参考素材）
 * - /delete   生成完成后销毁临时对象
 * 其余走静态资源。
 */

const API_UPSTREAM = "https://ai.centos.hk";
const PROXY_PREFIX = "/proxy";
const FILES_PREFIX = "/files/";

// 允许上传的类型与单文件大小上限（Worker 请求体上限约 100MB）
const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith(PROXY_PREFIX)) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      return proxy(request, url);
    }

    if (url.pathname === "/upload") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      return handleUpload(request, url, env);
    }

    if (url.pathname === "/delete") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      return handleDelete(request, env);
    }

    if (url.pathname.startsWith(FILES_PREFIX)) {
      return serveFile(request, url, env);
    }

    // 非代理请求交给静态资源绑定处理
    return env.assets.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

/* ----------------------------- 临时图床 ----------------------------- */

// 生成随机对象 key，避免可猜测/碰撞
function randomKey(ext) {
  const rand = crypto.randomUUID().replace(/-/g, "");
  return ext ? `${rand}.${ext}` : rand;
}

function extFromType(type) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };
  return map[type] || "bin";
}

async function handleUpload(request, url, env) {
  if (request.method !== "POST") {
    return json({ message: "Method Not Allowed" }, 405);
  }
  if (!env.UPLOADS) {
    return json({ message: "R2 未配置（UPLOADS binding 缺失）" }, 500);
  }

  // 限频：按客户端 IP，每 60s 20 次
  if (env.UPLOAD_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.UPLOAD_LIMITER.limit({ key: ip });
    if (!success) {
      return json({ message: "上传过于频繁，请稍后再试" }, 429);
    }
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!ALLOWED_PREFIXES.some((p) => contentType.startsWith(p))) {
    return json({ message: `不支持的文件类型: ${contentType || "未知"}` }, 415);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return json({ message: "空文件" }, 400);
  }
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    return json({ message: "文件过大（上限 50MB）" }, 413);
  }

  const key = randomKey(extFromType(contentType));
  await env.UPLOADS.put(key, body, {
    httpMetadata: { contentType },
    // 标记创建来源，便于生命周期规则/排查
    customMetadata: { uploadedAt: String(Date.now()) },
  });

  const publicUrl = `${url.origin}${FILES_PREFIX}${key}`;
  return json({ key, url: publicUrl, size: body.byteLength, contentType });
}

async function handleDelete(request, env) {
  if (request.method !== "POST") {
    return json({ message: "Method Not Allowed" }, 405);
  }
  if (!env.UPLOADS) return json({ message: "R2 未配置" }, 500);

  let key = "";
  try {
    const data = await request.json();
    key = data?.key || keyFromUrl(data?.url);
  } catch {
    return json({ message: "请求体需为 JSON，含 key 或 url" }, 400);
  }
  if (!key) return json({ message: "缺少 key" }, 400);

  await env.UPLOADS.delete(key);
  return json({ deleted: true, key });
}

// 从 /files/<key> 链接里提取对象 key
function keyFromUrl(u) {
  if (!u) return "";
  try {
    const p = new URL(u).pathname;
    return p.startsWith(FILES_PREFIX) ? p.slice(FILES_PREFIX.length) : "";
  } catch {
    return "";
  }
}

async function serveFile(request, url, env) {
  if (!env.UPLOADS) return new Response("R2 未配置", { status: 500 });
  const key = url.pathname.slice(FILES_PREFIX.length);
  if (!key) return new Response("Not Found", { status: 404 });

  const obj = await env.UPLOADS.get(key);
  if (!obj) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(obj.body, { headers });
}

/* ----------------------------- API 代理 ----------------------------- */

async function proxy(request, url) {
  const upstreamPath = url.pathname.slice(PROXY_PREFIX.length) || "/";
  const target = `${API_UPSTREAM}${upstreamPath}${url.search}`;

  const headers = new Headers();
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  headers.set("Accept", request.headers.get("Accept") || "application/json");
  const auth = request.headers.get("Authorization");
  if (auth) headers.set("Authorization", auth);
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);

  const init = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const resp = await fetch(target, init);
    const respHeaders = new Headers(resp.headers);
    respHeaders.delete("transfer-encoding");
    respHeaders.delete("connection");
    respHeaders.set("Access-Control-Allow-Origin", "*");
    return new Response(resp.body, { status: resp.status, headers: respHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ message: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
