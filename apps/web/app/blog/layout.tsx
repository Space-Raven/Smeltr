import type { ReactNode } from "react";

/**
 * Blog shell — warm parchment background per the forge style guide (pure
 * white is reserved for legal pages). Applies to the index and every post.
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div style={{ background: "#FDF8EF" }}>{children}</div>;
}
