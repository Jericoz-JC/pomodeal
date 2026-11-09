// `npm run build` (and `build:ci`): the build entry for Cloudflare Workers Builds, any CI, and local builds.
// - On `main` with a production CONVEX_DEPLOY_KEY: deploy Convex functions + schema, then build the PWA against it.
// - With a preview deploy key (any branch): deploy to that preview deployment, then build against it.
// - Anywhere else, including branch builds that can see the production key (Cloudflare Workers Builds shares
//   build variables across branches): build the PWA only, against .env.production. Only `main` ships production.
// On the production branch a missing key fails the build, so the site never ships ahead of its backend.
import { spawnSync } from "node:child_process";

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const key = (process.env.CONVEX_DEPLOY_KEY || "").trim();
const branch = process.env.WORKERS_CI_BRANCH || process.env.CF_PAGES_BRANCH || "";
// The part before "|" names the deployment (e.g. "prod:affable-hound-751") and is not secret.
const target = key ? key.split("|")[0] : "";
const isProdKey = target.startsWith("prod:");
console.log(`[ci-build] branch=${branch || "(unknown)"} deployKey=${target || "(not set)"}`);

if (key && (!isProdKey || branch === "main")) {
  run('npx convex deploy --cmd "npm run build:web" --cmd-url-env-var-name VITE_CONVEX_URL');
} else if (branch === "main") {
  console.error(
    "CONVEX_DEPLOY_KEY is not visible to this build, so the backend would not deploy.\n" +
      "Add it in Cloudflare: Workers & Pages > pomodeal > Settings > Build > Variables and secrets (not the runtime Variables and Secrets).",
  );
  process.exit(1);
} else {
  console.log(
    key
      ? `Production deploy key on branch "${branch || "(unknown)"}": only main deploys production, so building the web app without deploying Convex.`
      : "CONVEX_DEPLOY_KEY not set: building the web app without deploying Convex.",
  );
  run("npm run build:web");
}
