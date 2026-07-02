"use client";

/**
 * /coming-soon
 *
 * Shown to all visitors when NEXT_PUBLIC_MODE=coming-soon.
 * Minimal, on-brand, no external dependencies.
 */
export default function ComingSoonPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#1A0C05] px-6">
      {/* Coin logo mark */}
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mb-8"
      >
        {/* Coin */}
        <circle cx="48" cy="48" r="44" fill="#92400E" />
        <circle cx="48" cy="48" r="44" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="48" cy="48" r="38" fill="none" stroke="#B45309" strokeWidth="1" opacity="0.5" />
        {/* S glyph — two stacked diamonds */}
        <polygon
          points="48,18 62,36 62,48 34,48 34,36"
          fill="none"
          stroke="#1A0C05"
          strokeWidth="4"
          strokeLinejoin="miter"
        />
        <polygon
          points="48,18 62,36 62,48 34,48 34,36"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinejoin="miter"
        />
        <polygon
          points="34,48 62,48 62,60 48,78 34,60"
          fill="none"
          stroke="#1A0C05"
          strokeWidth="4"
          strokeLinejoin="miter"
        />
        <polygon
          points="34,48 62,48 62,60 48,78 34,60"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinejoin="miter"
        />
      </svg>

      {/* Wordmark */}
      <h1
        className="text-5xl font-bold tracking-wide mb-3"
        style={{ color: "#F59E0B", fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Smeltr
      </h1>

      <p
        className="text-sm tracking-[0.3em] uppercase mb-10"
        style={{ color: "#B45309" }}
      >
        Token Platform
      </p>

      {/* Message */}
      <p className="text-center text-amber-200/70 text-base max-w-sm leading-relaxed mb-8">
        A new way to deploy Solana tokens — coming soon.
      </p>

      {/* Public content — the guides and story are live before the forge opens */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <a
          href="/blog"
          className="rounded-lg border px-6 py-2.5 text-sm font-semibold no-underline transition-colors"
          style={{ borderColor: "#92400E", color: "#FCD34D" }}
        >
          Read the Token-2022 guides →
        </a>
        <a
          href="/about"
          className="rounded-lg border px-6 py-2.5 text-sm font-semibold no-underline transition-colors"
          style={{ borderColor: "#92400E", color: "#FCD34D" }}
        >
          About Smeltr
        </a>
      </div>

      {/* Chartreuse accent */}
      <div className="flex gap-2">
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-70" />
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-40" />
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-70" />
      </div>
    </main>
  );
}
