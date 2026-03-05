// Type declaration for Vite ?raw imports
// Allows importing .md files as raw strings at build time.
declare module '*.md?raw' {
    const content: string;
    export default content;
}
