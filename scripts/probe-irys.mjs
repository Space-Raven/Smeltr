/**
 * Lightweight Irys bundler connectivity check for CI / ops probes.
 * Exit 0 if all endpoints respond; exit 1 otherwise.
 */
const ENDPOINTS = [
  "https://devnet.irys.xyz/info",
  "https://uploader.irys.xyz/info",
];

const TIMEOUT_MS = 20_000;

async function probe(url) {
  const start = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${url} → HTTP ${res.status}: ${body.slice(0, 120)}`);
  }
  console.log(`OK ${url} (${Date.now() - start}ms, ${body.length} bytes)`);
}

for (const url of ENDPOINTS) {
  await probe(url).catch((err) => {
    console.error(`FAIL ${url}: ${err.message}`);
    process.exitCode = 1;
  });
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
