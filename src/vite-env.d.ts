/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROLLOUTS_PATH?: string;
  readonly VITE_POLL_INTERVAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface WindowStorage {
  get(key: string): Promise<{ value: string } | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

declare global {
  interface Window {
    storage: WindowStorage;
  }
}

export {};
