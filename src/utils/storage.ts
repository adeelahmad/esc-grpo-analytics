/* Thin wrapper around Gradio's window.storage API */

export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      const result = await window.storage?.get(key);
      return result?.value ?? null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      await window.storage?.set(key, value);
    } catch {
      // silently fail
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await window.storage?.delete(key);
    } catch {
      // silently fail
    }
  },
};
