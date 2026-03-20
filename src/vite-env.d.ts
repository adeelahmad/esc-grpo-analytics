/// <reference types="vite/client" />

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
