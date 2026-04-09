/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as appointments from "../appointments.js";
import type * as categories from "../categories.js";
import type * as doctors from "../doctors.js";
import type * as invoices from "../invoices.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as patients from "../patients.js";
import type * as pharmacy from "../pharmacy.js";
import type * as reports from "../reports.js";
import type * as stats from "../stats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  appointments: typeof appointments;
  categories: typeof categories;
  doctors: typeof doctors;
  invoices: typeof invoices;
  migrations: typeof migrations;
  notifications: typeof notifications;
  patients: typeof patients;
  pharmacy: typeof pharmacy;
  reports: typeof reports;
  stats: typeof stats;
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
