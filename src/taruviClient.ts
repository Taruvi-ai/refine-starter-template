import { Client } from "@taruvi/sdk";

type AxiosLikeRequestConfig = {
  method?: string;
  withCredentials?: boolean;
  headers?: Record<string, string> | { set?: (name: string, value: string) => void };
};

type AxiosLikeInstance = {
  interceptors?: {
    request?: {
      use: (onFulfilled: (config: AxiosLikeRequestConfig) => AxiosLikeRequestConfig) => void;
    };
  };
};

type HttpClientWithAxios = {
  axiosInstance?: AxiosLikeInstance;
};

const UNSAFE_HTTP_METHODS = new Set(["post", "put", "patch", "delete"]);

const readCookie = (name: string) => {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) ?? "";
};

const setHeader = (config: AxiosLikeRequestConfig, name: string, value: string) => {
  if (!config.headers) {
    config.headers = { [name]: value };
    return;
  }

  if (typeof (config.headers as { set?: unknown }).set === "function") {
    (config.headers as { set: (headerName: string, headerValue: string) => void }).set(name, value);
    return;
  }

  (config.headers as Record<string, string>)[name] = value;
};

const installCrossSiteAuthGuards = (client: Client) => {
  const axiosInstance = (client.httpClient as unknown as HttpClientWithAxios).axiosInstance;

  axiosInstance?.interceptors?.request?.use((config) => {
    const method = (config.method ?? "get").toLowerCase();
    if (!UNSAFE_HTTP_METHODS.has(method)) return config;

    const csrfToken = readCookie("csrftoken");
    if (csrfToken) {
      setHeader(config, "X-CSRFToken", csrfToken);
    }

    if (client.tokenClient.getSessionToken()) {
      config.withCredentials = false;
    }

    return config;
  });
};

// Validate required environment variables
const requiredEnvVars = {
  TARUVI_SITE_URL: __TARUVI_SITE_URL__,
  TARUVI_API_KEY: __TARUVI_API_KEY__,
  TARUVI_APP_SLUG: __TARUVI_APP_SLUG__,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please check your .env.local file. See .env.example for required variables.`
    );
  }
});

/**
 * Taruvi Client instance configured with environment variables.
 * Participant-facing setup uses TARUVI_* variables injected into the client
 * build through Vite configuration.
 * Used for Navkit, DataProviders, and direct SDK operations.
 *
 * @example
 * // Use with Refine providers (recommended)
 * import { taruviDataProvider, taruviAuthProvider } from "./providers/refineProviders";
 *
 * @example
 * // Direct SDK usage (advanced)
 * import { taruviClient } from "./taruviClient";
 * const response = await taruviClient.httpClient.get("api/...");
 *
 * @see {@link https://docs.taruvi.com|Taruvi Documentation}
 */
export const taruviClient = (() => {
  try {
    const client = new Client({
      apiKey: __TARUVI_API_KEY__,
      appSlug: __TARUVI_APP_SLUG__,
      apiUrl: __TARUVI_SITE_URL__,
    });

    installCrossSiteAuthGuards(client);
    return client;
  } catch (error) {
    console.error("Failed to initialize Taruvi Client:", error);
    throw new Error(
      "Taruvi configuration error. Please check your .env.local file. " +
        "See .env.example for required variables."
    );
  }
})();
