import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Token-2022 Guides & Tutorials",
  description:
    "Deep dives on Solana Token-2022 extensions: transfer fees, soul-bound tokens, permanent delegate, and more.",
};

const posts = [
  {
    slug: "how-to-deploy-solana-token-2022-transfer-fee",
    title: "How to deploy a Solana Token-2022 token with transfer fees",
    description:
      "A complete guide to the Token-2022 TransferFeeConfig extension — what it does, how it works technically, and how to deploy one without writing code.",
    date: "June 22, 2026",
    readTime: "8 min read",
    tag: "Tutorial",
  },
  {
    slug: "solana-soulbound-token-non-transferable-extension",
    title: "Soul-bound tokens on Solana: the Non-Transferable extension explained",
    description:
      "What soul-bound tokens are, why they matter for credentials and loyalty programmes, and how to deploy a non-transferable SPL token using Token-2022.",
    date: "June 29, 2026",
    readTime: "6 min read",
    tag: "Deep Dive",
  },
  {
    slug: "permanent-delegate-token-2022-explained",
    title: "Permanent Delegate: the most powerful (and misunderstood) Token-2022 extension",
    description:
      "Permanent Delegate lets a designated address transfer or burn tokens from any holder's account. Here's exactly what that means, when it's legitimate, and how to use it safely.",
    date: "June 30, 2026",
    readTime: "7 min read",
    tag: "Deep Dive",
  },
];

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
      <p className="text-gray-500 mb-12">Guides and deep dives on Solana Token-2022 extensions.</p>
      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block rounded-xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all no-underline"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="badge-indigo">{post.tag}</span>
              <span className="text-xs text-gray-400">{post.date} · {post.readTime}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">{post.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
