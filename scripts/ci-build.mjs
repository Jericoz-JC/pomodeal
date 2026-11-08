// `npm run build` (and `build:ci`): the build entry for Cloudflare Workers Builds, any CI, and local builds.
// With CONVEX_DEPLOY_KEY set (production, or a preview key): deploy Convex functions + schema,
// then build the PWA against that deployment's URL.
// Without it (e.g. a preview branch with no key): build the PWA only, against .env.production.
// On the production branch a missing key fails the build, so the site never ships ahead of its backend.
// Cloudflare Workers Builds gives every branch the same build variables, so branch builds see the
// production key too. Convex refuses a prod key outside `main` ("non-production build environment"),
// and a branch must never deploy prod anyway, so branches holding a prod key build the PWA only.
import { spawnSync } from "node:child_process";

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const key = (process.env.CONVEX_DEPLOY_KEY || "").trim();
const branch = process.env.WORKERS_CI_BRANCH || process.env.CF_PAGES_BRANCH || "";
// The part before "|" names the deployment (e.g. "prod:affable-hound-751") and is not secret.
console.log(`[ci-build] branch=${branch || "(unknown)"} deployKey=${key ? key.split("|")[0] : "(not set)"}`);

const prodKeyOnBranch = key.startsWith("prod:") && branch !== "" && branch !== "main";

if (prodKeyOnBranch) {
  console.log(`Production deploy key on branch "${branch}": building the web app without deploying Convex.`);
  run("npm run build:web");
} else if (key) {
  run('npx convex deploy --cmd "npm run build:web" --cmd-url-env-var-name VITE_CONVEX_URL');
} else if (branch === "main") {
  console.error(
    "CONVEX_DEPLOY_KEY is not visible to this build, so the backend would not deploy.\n" +
      "Add it in Cloudflare: Workers & Pages > pomodeal > Settings > Build > Variables and secrets (not the runtime Variables and Secrets).",
  );
  process.exit(1);
} else {
  console.log("CONVEX_DEPLOY_KEY not set: building the web app without deploying Convex.");
  run("npm run build:web");
}
