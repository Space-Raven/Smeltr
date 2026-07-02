"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "./WalletButton";

/**
 * Getting-started guide for first-time users on the deploy page.
 *
 * Onboarding to Web3 should be fun, unintimidating, and educational — so this
 * walks a newcomer from "no wallet" to "ready to deploy" with live step status,
 * a network-aware faucet nudge, and plain-language explainers. Returning users
 * can dismiss it (persisted in localStorage).
 */

const DISMISS_KEY = "smeltr_onboarding_dismissed";

function StepRow({
  n,
  done,
  title,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold ${
          done ? "bg-green-600 text-white" : "bg-amber-100 text-amber-800"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : n}
      </span>
      <div className="pt-0.5">
        <p className="font-medium text-amber-950">{title}</p>
        {children && <div className="mt-1.5 text-sm text-amber-900/80">{children}</div>}
      </div>
    </li>
  );
}

export function GettingStarted() {
  const { connected, wallets } = useWallet();
  const { connection } = useConnection();

  // Default to SHOWING the guide (new users + crawlers see it in SSR); returning
  // users who dismissed it get it collapsed once localStorage is read on mount.
  const [dismissed, setDismissed] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="text-sm text-amber-700 underline hover:text-amber-800"
      >
        New to this? Show the getting-started guide
      </button>
    );
  }

  const isDevnet = connection.rpcEndpoint.includes("devnet");
  const network = isDevnet ? "Devnet" : "Mainnet";
  const hasWalletInstalled = wallets.length > 0;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-amber-950">First time forging a token? 🔨</h3>
          <p className="mt-1 text-sm text-amber-900/80">
            No code, no jargon — just four steps. Pjorg will get you set up.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-none text-xs text-amber-700 underline hover:text-amber-800"
        >
          I&apos;ve done this before
        </button>
      </div>

      <ol className="mt-5 space-y-4">
        <StepRow n={1} done={hasWalletInstalled} title="Get a Solana wallet">
          A wallet is a free app that holds your token and signs approvals — like a
          keychain you control.{" "}
          {hasWalletInstalled ? (
            <span className="text-green-700">Wallet detected.</span>
          ) : (
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noreferrer"
              className="text-amber-700 underline"
            >
              Install Phantom (free) →
            </a>
          )}
        </StepRow>

        <StepRow n={2} done={connected} title="Connect it to Smeltr">
          {connected ? (
            <span className="text-green-700">Connected — you&apos;re ready.</span>
          ) : (
            <div className="flex items-center gap-3">
              <WalletButton />
              <span>Connecting only shares your public address, never your keys.</span>
            </div>
          )}
        </StepRow>

        <StepRow n={3} done={false} title={`Add a little SOL (on ${network})`}>
          Creating a token costs about <strong>0.05 SOL</strong> — a small network
          &amp; platform fee. Make sure your wallet is set to <strong>{network}</strong>{" "}
          and has a little SOL.
          {isDevnet && (
            <>
              {" "}
              Devnet SOL is free for testing:{" "}
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 underline"
              >
                get test SOL →
              </a>
            </>
          )}
        </StepRow>

        <StepRow n={4} done={false} title="Build, review, and sign">
          Pick your modules and metadata below, review the exact cost, then approve{" "}
          <strong>two</strong> signatures in your wallet — one to create the token,
          one to attach its name and logo. That&apos;s it.
        </StepRow>
      </ol>

      <div className="mt-5 border-t border-amber-200 pt-4">
        <button
          onClick={() => setShowGlossary((v) => !v)}
          className="text-sm font-medium text-amber-800 hover:text-amber-900"
        >
          {showGlossary ? "Hide" : "What do these words mean?"}
        </button>
        {showGlossary && (
          <dl className="mt-3 space-y-3 text-sm text-amber-900/80">
            <div>
              <dt className="font-semibold text-amber-950">Wallet</dt>
              <dd>
                An app (like Phantom) that stores your tokens and lets you approve
                actions. Smeltr never sees or holds your wallet&apos;s secret keys.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-950">Token</dt>
              <dd>
                A unit you create on Solana — for a community, a game, a membership,
                or a product. You decide its rules using the modules below.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-950">Why two signatures?</dt>
              <dd>
                Solana creates the token in one step, then attaches its name, symbol,
                and image in a second. Two quick approvals, one finished token.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-950">Devnet vs Mainnet</dt>
              <dd>
                Devnet is a free practice network — perfect for your first try.
                Mainnet is the real one. Switch networks inside your wallet&apos;s
                settings.
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
