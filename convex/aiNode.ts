"use node";
// Spec 008 "Suggest pieces": one call to Claude Haiku 5.5 with a strict JSON schema at low effort. Runs at most once
// per request and is never retried by us (the SDK retries one transient failure). Any failure writes "failed"; the
// sheet then says so and keeps the student's slots. Logs never hold the title or the model's output.
import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { cleanSuggestion } from "../packages/core/src";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { taskType } from "./schema";

const MODEL = "claude-haiku-5-5";
/** Room for low-effort thinking plus up to 12 short pieces. */
const MAX_TOKENS = 4000;
const TIMEOUT_MS = 30_000;

// Strict structured output: the API guarantees this shape. Counts and ranges aren't expressible in a strict
// schema, so core's cleanSuggestion enforces them after parsing (at most 12, minutes 5..240, titles up to 80).
const SCHEMA = {
  type: "object",
  properties: {
    pieces: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, minutes: { type: "integer" } },
        required: ["title", "minutes"],
        additionalProperties: false,
      },
    },
  },
  required: ["pieces"],
  additionalProperties: false,
};

const SYSTEM = `You split a student's coursework task into pieces they can work through in short focused blocks.
Return 3 to 8 pieces in the order they would be done, never more than 12.
Each title is a concrete action of a few words (at most 32 characters, it shows on a phone), in the language of the task title. No numbering, no dates.
Minutes are a realistic guess for that piece, between 10 and 120, in steps of 5.
When a total size is given, make the minutes add up to about that total.
Write plainly. No advice, no encouragement, no commentary.`;

const TYPE_WORDS: Record<string, string> = {
  writing: "a piece of writing", problems: "a problem set", exam: "studying for an exam", project: "a project",
};

export const suggestPieces = internalAction({
  args: {
    suggestionId: v.id("pieceSuggestions"),
    title: v.string(),
    taskType: v.optional(taskType),
    gutMin: v.optional(v.number()),
    daysLeft: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, { suggestionId, title, taskType, gutMin, daysLeft }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let raw: unknown = null;
    if (!apiKey) {
      console.error("ai: ANTHROPIC_API_KEY not set, suggestion failed");
    } else {
      const lines = [
        `Task title: ${title}`,
        ...(taskType ? [`Kind of task: ${TYPE_WORDS[taskType]}`] : []),
        ...(gutMin !== undefined ? [`Total size the student guessed: ${gutMin} minutes`] : []),
        ...(daysLeft !== undefined ? [`Days until it is due, counting today: ${daysLeft}`] : []),
      ];
      try {
        const client = new Anthropic({ apiKey, maxRetries: 1, timeout: TIMEOUT_MS });
        const res = await client.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM,
          output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
          messages: [{ role: "user", content: lines.join("\n") }],
        });
        // A refusal or a cut-off answer may not match the schema: treat both as no suggestion.
        if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") {
          console.error(`ai: no suggestion, stop_reason ${res.stop_reason}`);
        } else {
          const text = res.content.find((b) => b.type === "text");
          // Clamped here and again in writeSuggestion, so only plain { title, minutes } values cross into Convex.
          if (text && text.type === "text") raw = { pieces: cleanSuggestion(JSON.parse(text.text)) };
        }
      } catch (err) {
        // Typed SDK errors carry a status; log only the class and status, never the request or the output.
        if (err instanceof Anthropic.APIError) console.error(`ai: ${err.constructor.name} ${err.status ?? ""}`.trim());
        else console.error(`ai: suggestion failed (${err instanceof SyntaxError ? "unparseable output" : "error"})`);
      }
    }
    await ctx.runMutation(internal.ai.writeSuggestion, { suggestionId, raw });
    return null;
  },
});
