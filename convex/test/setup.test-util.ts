/// <reference types="vite/client" />
// Shared test setup. Multi-dot file names (*.test-util.ts) are skipped by the Convex bundler,
// so this can use import.meta.glob and test-only packages.
import { convexTest } from "convex-test";
import schema from "../schema";

// Everything under convex/ except tests and config (so _generated/api resolves).
const modules = import.meta.glob(["../**/*.*s", "!../test/**", "!../vitest.config.ts"]);

/** A fresh in-memory Convex backend with this app's schema and functions. */
export function newT() {
  return convexTest(schema, modules);
}
