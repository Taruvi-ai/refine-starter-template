import { taruviClient } from "../taruviClient";
import type { FunctionMeta } from "../providers/refineProviders";

type FunctionExecutionEnvelope = {
  status?: string;
  code?: string;
  message?: string;
  data?: unknown;
  result?: unknown;
  detail?: string;
  error?: string;
};

type FunctionRuntimeResult = {
  result?: unknown;
  success?: boolean;
  stdout?: string;
  stderr?: string;
};

const unwrapFunctionResult = <T>(payload: unknown): T => {
  const envelope = payload as FunctionExecutionEnvelope;
  const data = envelope?.data ?? payload;
  const dataRecord = data as { result?: unknown; async?: boolean };

  if (dataRecord?.result && typeof dataRecord.result === "object") {
    const runtimeResult = dataRecord.result as FunctionRuntimeResult;
    if ("result" in runtimeResult && ("success" in runtimeResult || "stdout" in runtimeResult || "stderr" in runtimeResult)) {
      return runtimeResult.result as T;
    }
  }

  if ("result" in envelope && envelope.result !== undefined) {
    return envelope.result as T;
  }

  return data as T;
};

const errorMessageFromPayload = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as FunctionExecutionEnvelope;
  return record.message || record.detail || record.error || fallback;
};

const isAuthenticationFailure = (payload: unknown, status?: number) => {
  if (status === 401 || status === 410) return true;
  if (!payload || typeof payload !== "object") return false;

  const record = payload as FunctionExecutionEnvelope;
  const message = `${record.message ?? ""} ${record.detail ?? ""} ${record.error ?? ""}`.toLowerCase();
  return message.includes("authentication required") || message.includes("session") && message.includes("expired");
};

const redirectToLogin = () => {
  taruviClient.tokenClient.clearTokens();
  if (typeof window === "undefined") return;

  const { apiUrl } = taruviClient.getConfig();
  const callbackUrl = `${window.location.origin}${window.location.pathname}`;
  window.location.href = `${apiUrl}/accounts/login/?redirect_to=${encodeURIComponent(callbackUrl)}`;
};

/**
 * Execute a serverless function via the live app-scoped Functions API.
 *
 * @example
 * const result = await executeFunction("calculate-total", { items: [1, 2, 3] });
 *
 * @example
 * const taskInfo = await executeFunction("process-data", { dataset: "large_file.csv" }, { kind: "function", async: true });
 */
export const executeFunction = async <T = unknown>(
  functionSlug: string,
  params: Record<string, unknown> = {},
  options?: FunctionMeta
): Promise<T> => {
  const { apiUrl, appSlug } = taruviClient.getConfig();
  const sessionToken = taruviClient.tokenClient.getSessionToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (sessionToken) {
    headers["X-Session-Token"] = sessionToken;
  }

  const response = await fetch(`${apiUrl}/api/apps/${appSlug}/functions/${functionSlug}/execute/`, {
    method: "POST",
    credentials: "omit",
    headers,
    body: JSON.stringify({
      async: options?.async ?? false,
      params,
    }),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (isAuthenticationFailure(payload, response.status)) {
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(errorMessageFromPayload(payload, `Function request failed with status ${response.status}`));
  }

  if ((payload as FunctionExecutionEnvelope)?.status === "error") {
    throw new Error(errorMessageFromPayload(payload, "Function execution failed"));
  }

  return unwrapFunctionResult<T>(payload);
};

/**
 * Execute a serverless function without waiting for the result (fire and forget)
 *
 * @example
 * executeFunctionAsync("send-notification", { message: "Done", userId: 123 }).catch(console.warn);
 */
export const executeFunctionAsync = async (
  functionSlug: string,
  params: Record<string, unknown> = {}
): Promise<void> => {
  await executeFunction(functionSlug, params, { kind: "function", async: true });
};
