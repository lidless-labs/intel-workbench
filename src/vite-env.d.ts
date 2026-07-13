/// <reference types="vite/client" />

// TS7 native rejects side-effect imports of non-code modules without a
// declaration. Vite resolves these at build time; declare them for typecheck.
declare module '*.css';
