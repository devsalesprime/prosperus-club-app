// tests/setup.ts
// Global test setup for Vitest + React Testing Library + jsdom

import '@testing-library/jest-dom/vitest';

// Mock matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock URL.createObjectURL/revokeObjectURL for download tests
Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: () => 'blob:mock-url',
});
Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: () => { },
});
