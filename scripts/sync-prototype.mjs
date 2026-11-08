// Copies the design prototype into the web app as its index.html, adding the document head
// (the prototype is authored as an artifact body) and the app module. Run before dev/build.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "prototypes/quick-deal/index.html"), "utf8");

// Pull <title>/<meta>/<link>/<style> into <head>; the rest is the body.
const headParts = [];
const body = src.replace(/<(title|style)[\s\S]*?<\/\1>|<(meta|link)\b[^>]*>/g, (m) => { headParts.push(m); return ""; });
const head = headParts.filter((p) => !/name="viewport"/.test(p) && !/claude:viewport/.test(p));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EDEFE9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#18201C" media="(prefers-color-scheme: dark)">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<!-- generated from prototypes/quick-deal/index.html by scripts/sync-prototype.mjs; edit the prototype, not this file -->
${head.join("\n")}
<style>:root{padding-top:env(safe-area-inset-top,0px)}</style>
</head>
<body>
${body.trim()}
<script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
writeFileSync(join(root, "apps/web/index.html"), html);
console.log("synced prototype -> apps/web/index.html");
