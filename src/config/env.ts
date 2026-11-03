/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Application environment configuration
 * Sourced directly from Vite environment variables (.env)
 */

export const BASE_URL: string = (
  import.meta.env.VITE_APP_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  ""
).replace(/\/$/, "");

export const CDN_URL: string = (
  import.meta.env.VITE_APP_CDN_URL ||
  import.meta.env.VITE_CDN_URL ||
  ""
).replace(/\/$/, "");

export const ACCOUNT_ID: string =
  import.meta.env.VITE_APP_ACCOUNT_ID ||
  import.meta.env.VITE_ACCOUNT_ID ||
  "";

export const hasConfiguredAccountId = Boolean(ACCOUNT_ID);

