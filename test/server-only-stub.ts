// Test stub for the `server-only` package. The real module throws when imported
// outside a React Server Component, which breaks vitest (it has no react-server
// resolve condition). Aliasing to this empty module in vitest.config.ts lets
// server-only modules (e.g. lib/orderAccess.ts) be unit-tested while keeping the
// real build-time guard intact for app/client bundles.
export {};
