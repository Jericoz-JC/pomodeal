import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Spec 008: AI suggestion rows live at most 24 hours; old usage days go too (only the daily limits read them).
crons.cron("sweep AI suggestions", "17 9 * * *", internal.ai.sweepSuggestions, {});

export default crons;
