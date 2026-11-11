/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiNode from "../aiNode.js";
import type * as beta from "../beta.js";
import type * as checkIns from "../checkIns.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_members from "../lib/members.js";
import type * as lib_nights from "../lib/nights.js";
import type * as lib_pushSchedule from "../lib/pushSchedule.js";
import type * as lib_suggestions from "../lib/suggestions.js";
import type * as lib_tasks from "../lib/tasks.js";
import type * as metrics from "../metrics.js";
import type * as nights from "../nights.js";
import type * as push from "../push.js";
import type * as pushNode from "../pushNode.js";
import type * as sessions from "../sessions.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiNode: typeof aiNode;
  beta: typeof beta;
  checkIns: typeof checkIns;
  crons: typeof crons;
  events: typeof events;
  "lib/events": typeof lib_events;
  "lib/members": typeof lib_members;
  "lib/nights": typeof lib_nights;
  "lib/pushSchedule": typeof lib_pushSchedule;
  "lib/suggestions": typeof lib_suggestions;
  "lib/tasks": typeof lib_tasks;
  metrics: typeof metrics;
  nights: typeof nights;
  push: typeof push;
  pushNode: typeof pushNode;
  sessions: typeof sessions;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
