type AppEnvironment = 'development' | 'preview' | 'production' | 'test';

function readString(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readBoolean(name: keyof ImportMetaEnv, fallback: boolean): boolean {
  const raw = readString(name);
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  console.warn(`[env] ${String(name)} must be "true" or "false"; using ${fallback}.`);
  return fallback;
}

function readPositiveInt(name: keyof ImportMetaEnv, fallback: number): number {
  const raw = readString(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(`[env] ${String(name)} must be a positive integer; using ${fallback}.`);
    return fallback;
  }
  return parsed;
}

function readAppEnvironment(): AppEnvironment {
  const value = readString('VITE_APP_ENV', import.meta.env.PROD ? 'production' : 'development');
  if (value === 'development' || value === 'preview' || value === 'production' || value === 'test') {
    return value;
  }
  console.warn(`[env] VITE_APP_ENV has unsupported value "${value}"; using development.`);
  return 'development';
}

export const appEnv = Object.freeze({
  app: {
    name: readString('VITE_APP_NAME', 'Tabula Design Now'),
    url: readString('VITE_APP_URL', 'https://www.tabuladesignnow.com'),
    environment: readAppEnvironment(),
  },
  supabase: {
    url: readString('VITE_SUPABASE_URL'),
    publishableKey: readString('VITE_SUPABASE_PUBLISHABLE_KEY'),
  },
  codeStudio: {
    javascriptEnabled: readBoolean('VITE_ENABLE_JAVASCRIPT', true),
    pythonEnabled: readBoolean('VITE_ENABLE_PYTHON', true),
    executionEnabled: readBoolean('VITE_ENABLE_CODE_EXECUTION', true),
  },
  execution: {
    timeoutMs: readPositiveInt('VITE_EXECUTION_TIMEOUT_MS', 5000),
    maxCodeSizeKb: readPositiveInt('VITE_MAX_CODE_SIZE_KB', 250),
    maxConsoleLines: readPositiveInt('VITE_MAX_CONSOLE_LINES', 500),
  },
  python: {
    pyodideVersion: readString('VITE_PYODIDE_VERSION', '0.29.0'),
    packagesEnabled: readBoolean('VITE_PYTHON_PACKAGES_ENABLED', true),
  },
  product: {
    autosaveEnabled: readBoolean('VITE_ENABLE_AUTOSAVE', true),
    previewEnabled: readBoolean('VITE_ENABLE_PREVIEW', true),
    exportEnabled: readBoolean('VITE_ENABLE_EXPORT', true),
    githubSyncEnabled: readBoolean('VITE_ENABLE_GITHUB_SYNC', false),
    aiEnabled: readBoolean('VITE_ENABLE_AI', false),
  },
});

export type TabulaEnvironment = typeof appEnv;
