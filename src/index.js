/**
 * Seedance Worker：静态资源托管 + API 反向代理（解决浏览器 CORS）。
 * 与本地 server.py 行为保持一致：/proxy/* 转发到 API_UPSTREAM，其余走静态资源。
 */

const API_UPSTREAM = "https://ai.centos.hk";
const PROXY_PREFIX = "/proxy";

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

    // 非代理请求交给静态资源绑定处理
    return env.assets.fetch(request);
  },
};

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
