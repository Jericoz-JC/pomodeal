// Serves the synthetic fixture pages.
//   http://localhost:5174  allowed web-app origin (stands in for the Vite dev server on 5173)
//   http://localhost:5199  matches the manifest pattern but is NOT on the worker's allowlist
// The same pages on http://127.0.0.1:<port> are outside externally_connectable entirely.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("./fixtures/", import.meta.url));

export function startFixtures(ports = [5174, 5199]) {
  const servers = ports.map((port) =>
    createServer(async (req, res) => {
      const name = new URL(req.url, "http://x").pathname.replace(/^\/+/, "") || "hostile.html";
      if (!/^[a-z-]+\.html$/.test(name)) return res.writeHead(404).end();
      try {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(await readFile(dir + name));
      } catch {
        res.writeHead(404).end();
      }
    }).listen(port, "127.0.0.1"),
  );
  return () => Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startFixtures();
  console.log("Fixtures on http://localhost:5174/hostile.html and http://localhost:5174/handshake.html");
}
