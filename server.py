#!/usr/bin/env python3
"""静态文件服务 + API 反向代理，解决浏览器 CORS 跨域。"""

import http.server
import json
import os
import urllib.error
import urllib.request

API_UPSTREAM = "https://ai.centos.hk"
PORT = int(os.environ.get("PORT", "8765"))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
PROXY_PREFIX = "/proxy"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith(PROXY_PREFIX):
            self.proxy("GET")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith(PROXY_PREFIX):
            self.proxy("POST")
        else:
            super().do_POST()

    def proxy(self, method):
        upstream_path = self.path[len(PROXY_PREFIX):]
        if not upstream_path:
            upstream_path = "/"
        url = f"{API_UPSTREAM}{upstream_path}"

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": self.headers.get("Accept", "application/json"),
        }
        auth = self.headers.get("Authorization")
        if auth:
            headers["Authorization"] = auth
        content_type = self.headers.get("Content-Type")
        if content_type:
            headers["Content-Type"] = content_type

        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for key, val in resp.headers.items():
                    if key.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(key, val)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            payload = json.dumps({"message": str(e)}).encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload)


if __name__ == "__main__":
    os.chdir(ROOT)
    with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
        print(f"Seedance 站点: http://localhost:{PORT}")
        print(f"API 代理:     http://localhost:{PORT}{PROXY_PREFIX}/v1/videos")
        httpd.serve_forever()