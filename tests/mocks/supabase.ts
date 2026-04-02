// tests/mocks/supabase.ts
// Centralized Supabase mock for all service tests

import { vi } from 'vitest';

// Chainable query builder mock
function createQueryBuilder() {
    const builder: Record<string, any> = {};
    const methods = [
        'select', 'insert', 'update', 'delete', 'upsert',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
        'in', 'is', 'or', 'and', 'not', 'filter',
        'order', 'limit', 'range', 'single', 'maybeSingle',
        'textSearch', 'match', 'contains', 'containedBy',
        'csv', 'explain'
    ];

    // Default resolved value
    let resolvedValue: any = { data: null, error: null, count: null };

    for (const method of methods) {
        builder[method] = vi.fn().mockImplementation(() => {
            // For terminal methods, return the promise
            if (['single', 'maybeSingle'].includes(method)) {
                return Promise.resolve(resolvedValue);
            }
            return builder;
        });
    }

    // When awaited (then), resolve with the current value
    builder.then = (resolve: (val: any) => void) => {
        return Promise.resolve(resolvedValue).then(resolve);
    };

    // Allow setting the resolved value for this chain
    builder.__setResolvedValue = (val: any) => {
        resolvedValue = val;
    };

    return builder;
}

// Create the main mock
const queryBuilder = createQueryBuilder();

export const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@test.com' } },
            error: null
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } }
        }),
    },
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
};

// Auto-mock the supabase module
vi.mock('../../lib/supabase', () => ({
    supabase: mockSupabase,
    default: mockSupabase,
}));

export { queryBuilder };
