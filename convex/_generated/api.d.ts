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
import type * as adminNotifications from "../adminNotifications.js";
import type * as appointmentLimits from "../appointmentLimits.js";
import type * as appointmentNotifications from "../appointmentNotifications.js";
import type * as appointments from "../appointments.js";
import type * as cancellationAlerts from "../cancellationAlerts.js";
import type * as categories from "../categories.js";
import type * as doctorSecretaryMessages from "../doctorSecretaryMessages.js";
import type * as doctors from "../doctors.js";
import type * as invoiceNotifications from "../invoiceNotifications.js";
import type * as invoices from "../invoices.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as patientProfiles from "../patientProfiles.js";
import type * as patientSecretaryNotifications from "../patientSecretaryNotifications.js";
import type * as patients from "../patients.js";
import type * as pharmacy from "../pharmacy.js";
import type * as reportNotifications from "../reportNotifications.js";
import type * as reports from "../reports.js";
import type * as roleNotifications from "../roleNotifications.js";
import type * as secretaryDoctorNotifications from "../secretaryDoctorNotifications.js";
import type * as stats from "../stats.js";
import type * as trash from "../trash.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  adminNotifications: typeof adminNotifications;
  appointmentLimits: typeof appointmentLimits;
  appointmentNotifications: typeof appointmentNotifications;
  appointments: typeof appointments;
  cancellationAlerts: typeof cancellationAlerts;
  categories: typeof categories;
  doctorSecretaryMessages: typeof doctorSecretaryMessages;
  doctors: typeof doctors;
  invoiceNotifications: typeof invoiceNotifications;
  invoices: typeof invoices;
  migrations: typeof migrations;
  notifications: typeof notifications;
  patientProfiles: typeof patientProfiles;
  patientSecretaryNotifications: typeof patientSecretaryNotifications;
  patients: typeof patients;
  pharmacy: typeof pharmacy;
  reportNotifications: typeof reportNotifications;
  reports: typeof reports;
  roleNotifications: typeof roleNotifications;
  secretaryDoctorNotifications: typeof secretaryDoctorNotifications;
  stats: typeof stats;
  trash: typeof trash;
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
