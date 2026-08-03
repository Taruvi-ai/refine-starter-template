declare module "@fortawesome/fontawesome-svg-core" {
  export type IconDefinition = unknown;
  export type IconName = string;
  export type IconProp = unknown;
  export const findIconDefinition: (iconLookup: unknown) => IconDefinition;
  export const library: {
    add: (...icons: unknown[]) => void;
  };
}

declare module "@taruvi/refine-providers" {
  export type TaruviMeta = Record<string, unknown>;

  export type TaruviListResponse<TData = unknown> = {
    data?: TData[];
    total?: number;
    [key: string]: unknown;
  };

  export type StorageUploadVariables = {
    files: File[];
    paths?: string[];
    metadatas?: Record<string, unknown>[];
    [key: string]: unknown;
  };

  export type LoginParams = Record<string, unknown>;
  export type LogoutParams = Record<string, unknown>;
  export type RegisterParams = Record<string, unknown>;

  export type FunctionMeta = {
    kind?: "function";
    async?: boolean;
    [key: string]: unknown;
  };

  export type AnalyticsMeta = {
    kind?: "analytics";
    [key: string]: unknown;
  };

  export const dataProvider: (client: unknown) => any;
  export const authProvider: (client: unknown) => any;
  export const storageDataProvider: (client: unknown) => any;
  export const appDataProvider: (client: unknown) => any;
  export const userDataProvider: (client: unknown) => any;
  export const accessControlProvider: (client: unknown) => any;

  export const buildRefineQueryParams: (...args: unknown[]) => unknown;
  export const convertRefineFilters: (...args: unknown[]) => unknown;
  export const convertRefineSorters: (...args: unknown[]) => unknown;
  export const convertRefinePagination: (...args: unknown[]) => unknown;
  export const buildQueryString: (...args: unknown[]) => string;
  export const REFINE_OPERATOR_MAP: Record<string, string>;
}
