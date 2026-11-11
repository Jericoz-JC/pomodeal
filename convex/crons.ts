import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Spec 008: AI suggestion rows live at most 24 hours; old usage days go too (only the daily limits read them).
crons.cron("sweep AI suggestions", "17 9 * * *", internal.ai.sweepSuggestions, {});
// Spec 012 section 7: tonight's plan vanishes; nights more than 2 days old are deleted.
crons.cron("sweep old nights", "23 9 * * *", internal.nights.sweep, {});

export default crons;
