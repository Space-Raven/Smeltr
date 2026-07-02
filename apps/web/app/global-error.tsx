"use client";

/**
 * Root-layout error boundary — last resort when the layout itself throws.
 * Must render its own <html>/<body> since the root layout is gone.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A0C05",
          color: "#FEF3C7",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Smeltr hit an unexpected error</h1>
        <p style={{ maxWidth: 420, fontSize: 14, color: "#D97706", lineHeight: 1.6 }}>
          Nothing was sent on-chain. Reload to continue{error.digest ? ` (error ${error.digest})` : ""},
          or email pjorg@smeltr.org if this persists.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 20,
            background: "#F59E0B",
            color: "#1A0C05",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
