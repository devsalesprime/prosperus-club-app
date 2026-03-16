// utils/isAbortError.ts
// Helper to detect AbortError from Supabase auth lock contention
// or React component unmount during fetch
//
// Usage: catch (err) { if (isAbortError(err)) return null; throw err; }

export function isAbortError(err: unknown): boolean {
    if (err instanceof Error) {
        return (
            err.name === 'AbortError' ||
            err.message.includes('AbortError') ||
            err.message.includes('signal is aborted')
        );
    }
    // Supabase sometimes returns { message: 'AbortError...' }
    if (typeof err === 'object' && err !== null) {
        const e = err as Record<string, unknown>;
        return (
            typeof e.message === 'string' &&
            (e.message.includes('AbortError') || e.message.includes('signal is aborted'))
        );
    }
    return false;
}
