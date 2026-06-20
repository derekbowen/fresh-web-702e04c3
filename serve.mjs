import { WebSocket } from "ws";
globalThis.WebSocket = WebSocket;

import { createServer } from "node:http";
import { Readable } from "node:stream";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(__dirname, "dist", "client");

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2",
  ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain",
};

async function tryStatic(url, nodeRes) {
  const filePath = join(clientDir, url === "/" ? "index.html" : url);
  if (!filePath.startsWith(clientDir)) return false;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return false;
    const data = await readFile(filePath);
    const mime = MIME[extname(filePath)] || "application/octet-stream";
    const headers = { "Content-Type": mime, "Content-Length": data.length };
    if (url.startsWith("/fw-assets/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }
    nodeRes.writeHead(200, headers);
    nodeRes.end(data);
    return true;
  } catch { return false; }
}

const { default: server } = await import("./dist/server/server.js");
const PORT = process.env.PORT || 3000;

createServer(async (nodeReq, nodeRes) => {
  try {
    const url = new URL(nodeReq.url, `http://${nodeReq.headers.host}`);

    if (await tryStatic(url.pathname, nodeRes)) return;

    const headers = new Headers();
    for (const [key, value] of Object.entries(nodeReq.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    let body = null;
    if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
      body = Readable.toWeb(nodeReq);
    }

    const request = new Request(url.toString(), {
      method: nodeReq.method, headers, body, duplex: "half",
    });

    const response = await server.fetch(request);

    const resHeaders = {};
    response.headers.forEach((v, k) => { resHeaders[k] = v; });
    nodeRes.writeHead(response.status, resHeaders);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          nodeRes.write(value);
        }
        nodeRes.end();
      };
      await pump();
    } else {
      nodeRes.end(response.body ? await response.text() : "");
    }
  } catch (err) {
    console.error("Request error:", err);
    nodeRes.writeHead(500);
    nodeRes.end("Internal Server Error");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Fresh-web PSEO running on :${PORT}`);
});
