// Build entry for Cloudflare Pages (and any CI).
// With CONVEX_DEPLOY_KEY set (production, or a preview key): deploy Convex functions + schema,
// then build the PWA against that deployment's URL.
// Without it (e.g. a preview branch with no key): build the PWA only, without a backend URL.
import { spawnSync } from "node:child_process";

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (process.env.CONVEX_DEPLOY_KEY) {
  run('npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL');
} else {
  console.log("CONVEX_DEPLOY_KEY not set: building the web app without deploying Convex.");
  run("npm run build");
}
