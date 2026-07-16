/** Suppress noisy native-module fallback warnings during unit/integration tests. */
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("bigint: Failed to load bindings")) return;
  warn(...args);
};
