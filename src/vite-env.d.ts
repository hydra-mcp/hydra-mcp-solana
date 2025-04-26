/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_BASE_URL: string;
    readonly MODE: string;
    // More environment variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
