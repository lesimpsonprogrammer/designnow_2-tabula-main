/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_APP_ENV?: string;

  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;

  readonly VITE_ENABLE_JAVASCRIPT?: string;
  readonly VITE_ENABLE_PYTHON?: string;
  readonly VITE_ENABLE_CODE_EXECUTION?: string;

  readonly VITE_EXECUTION_TIMEOUT_MS?: string;
  readonly VITE_MAX_CODE_SIZE_KB?: string;
  readonly VITE_MAX_CONSOLE_LINES?: string;

  readonly VITE_PYODIDE_VERSION?: string;
  readonly VITE_PYTHON_PACKAGES_ENABLED?: string;

  readonly VITE_ENABLE_AUTOSAVE?: string;
  readonly VITE_ENABLE_PREVIEW?: string;
  readonly VITE_ENABLE_EXPORT?: string;
  readonly VITE_ENABLE_GITHUB_SYNC?: string;
  readonly VITE_ENABLE_AI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
