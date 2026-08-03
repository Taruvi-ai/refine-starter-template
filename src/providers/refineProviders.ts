import {
  dataProvider,
  authProvider,
  storageDataProvider,
  appDataProvider,
  userDataProvider,
  accessControlProvider,
} from "@taruvi/refine-providers";
import type { AuthProvider } from "@refinedev/core";
import { Database } from "@taruvi/sdk";
import { taruviClient } from "../taruviClient";

export type { UserData as TaruviUser } from "@taruvi/sdk";
export type {
  TaruviMeta,
  TaruviListResponse,
  StorageUploadVariables,
  LoginParams,
  LogoutParams,
  RegisterParams,
  FunctionMeta,
  AnalyticsMeta,
} from "@taruvi/refine-providers";

export {
  buildRefineQueryParams,
  convertRefineFilters,
  convertRefineSorters,
  convertRefinePagination,
  buildQueryString,
  REFINE_OPERATOR_MAP,
} from "@taruvi/refine-providers";

/**
 * Refine providers for Taruvi
 *
 * - taruviDataProvider (default): Database CRUD
 * - taruviStorageProvider (storage): File upload/download/delete
 * - taruviAppProvider (app): Functions, analytics, roles, settings, secrets
 * - taruviUserProvider (user): User CRUD and roles
 * - taruviAuthProvider: Authentication
 * - taruviAccessControlProvider: Cerbos permission checks
 */

type DatabaseFilterCompat = typeof Database.prototype & {
  filter?: typeof Database.prototype.filters;
};

const databasePrototype = Database.prototype as DatabaseFilterCompat;

// Compatibility for @taruvi/refine-providers 1.3.x with @taruvi/sdk 1.5.x.
// The provider still calls `filter(...)`; the SDK renamed it to `filters(...)`.
if (!databasePrototype.filter) {
  databasePrototype.filter = databasePrototype.filters;
}

const baseTaruviAuthProvider = authProvider(taruviClient);
const AUTH_CHECK_TTL_MS = 60_000;
let lastSuccessfulAuthCheckAt = 0;

const clearStaleSession = () => {
  lastSuccessfulAuthCheckAt = 0;
  taruviClient.tokenClient.clearTokens();
};

export const taruviDataProvider = dataProvider(taruviClient);
export const taruviAuthProvider: AuthProvider = {
  ...baseTaruviAuthProvider,
  check: async () => {
    if (!taruviClient.tokenClient.isAuthenticated()) {
      clearStaleSession();
      return { authenticated: false };
    }

    if (Date.now() - lastSuccessfulAuthCheckAt < AUTH_CHECK_TTL_MS) {
      return { authenticated: true };
    }

    try {
      const result = await baseTaruviAuthProvider.check?.();
      if (result?.authenticated) {
        lastSuccessfulAuthCheckAt = Date.now();
        return result;
      }
    } catch {
      clearStaleSession();
      return { authenticated: false };
    }

    clearStaleSession();
    return { authenticated: false };
  },
  onError: async (error) => {
    const status = (error as { statusCode?: number; status?: number; response?: { status?: number } })?.statusCode
      ?? (error as { status?: number })?.status
      ?? (error as { response?: { status?: number } })?.response?.status;
    const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? "");

    if (status === 401 || status === 410 || message.includes("Authentication required")) {
      clearStaleSession();
      return { logout: true, redirectTo: "/login", error };
    }

    return baseTaruviAuthProvider.onError?.(error) ?? { error };
  },
};
export const taruviStorageProvider = storageDataProvider(taruviClient);
export const taruviAppProvider = appDataProvider(taruviClient);
export const taruviUserProvider = userDataProvider(taruviClient);
export const taruviAccessControlProvider = accessControlProvider(taruviClient);
