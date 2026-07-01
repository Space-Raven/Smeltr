import type { ReactNode } from "react";

/**
 * Shared layout for legal pages (/terms, /privacy, /refunds).
 * White background is intentional — the style guide reserves it for
 * strictly professional pages, which these are.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500 mb-10">
          Smeltr Technologies LLC · Last updated: {updated}
        </p>
        <div
          className="prose-sm text-gray-700 leading-relaxed
                     [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-3
                     [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
                     [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1
                     [&_strong]:text-gray-900
                     [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:border-b [&_th]:py-2 [&_td]:border-b [&_td]:py-2"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
