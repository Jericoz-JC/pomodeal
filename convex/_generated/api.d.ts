/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as beta from "../beta.js";
import type * as events from "../events.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_members from "../lib/members.js";
import type * as lib_pushSchedule from "../lib/pushSchedule.js";
import type * as lib_tasks from "../lib/tasks.js";
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
  beta: typeof beta;
  events: typeof events;
  "lib/events": typeof lib_events;
  "lib/members": typeof lib_members;
  "lib/pushSchedule": typeof lib_pushSchedule;
  "lib/tasks": typeof lib_tasks;
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
