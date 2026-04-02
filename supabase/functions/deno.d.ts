// Ambient type declarations for Deno runtime
// This makes Deno available globally in TypeScript without imports

interface DenoEnv {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
}

interface DenoNamespace {
    env: DenoEnv;
    serve(
        handler: (request: Request) => Response | Promise<Response>,
        options?: {
            port?: number;
            hostname?: string;
            signal?: AbortSignal;
            onListen?: (params: { hostname: string; port: number }) => void;
            onError?: (error: unknown) => Response | Promise<Response>;
        }
    ): void;
    cron(
        name: string,
        schedule: string,
        handler: () => void | Promise<void>
    ): void;
}

declare const Deno: DenoNamespace;
