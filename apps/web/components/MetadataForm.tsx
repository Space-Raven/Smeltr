"use client";
import { useCallback, useState } from "react";
import { compressImageForUpload } from "../lib/imageCompression";
import { useIrysUpload } from "../hooks/useIrysUpload";
import { useSubscription } from "../hooks/useSubscription";
import type { TokenMetadataInput } from "@platform/module-registry";

type Step = "idle" | "compressing" | "uploading-image" | "uploading-json" | "done" | "error";

interface MetadataFormProps {
  onChange: (input: TokenMetadataInput | undefined) => void;
}

/**
 * Collects name/symbol/description/image, uploads to Arweave via Irys, and
 * reports the resulting { name, symbol, uri } once both uploads succeed.
 *
 * Upload routing:
 *   - Premium subscribers → /api/upload/metadata (platform-funded, no wallet tx)
 *   - Free users          → useIrysUpload (client-side wallet-funded path)
 *
 * Image and JSON uploads are independently retryable: the image URI is
 * persisted in state once uploaded, so a retry after a JSON-upload failure
 * does not re-upload the image (Arweave data can't be deleted).
 */
export function MetadataForm({ onChange }: MetadataFormProps) {
  const { upload: walletUpload } = useIrysUpload();
  const subscriptionStatus = useSubscription();
  const isPremium = subscriptionStatus === "premium";

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fundingNotice, setFundingNotice] = useState(false);

  const resetUploadState = () => {
    onChange(undefined);
    setStep("idle");
    setError(null);
  };

  /**
   * Platform-funded upload for premium subscribers.
   * Sends multipart/form-data to /api/upload/metadata and returns the URI.
   */
  const platformUpload = useCallback(
    async (blob: Blob, contentType: string): Promise<string> => {
      const form = new FormData();
      form.append("file", blob);
      form.append("type", contentType);
      const res = await fetch("/api/upload/metadata", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Upload failed (HTTP ${res.status})`);
      }
      const { uri } = await res.json() as { uri: string };
      return uri;
    },
    []
  );

  const runUpload = useCallback(async () => {
    if (!imageFile || !name || !symbol) return;
    setError(null);

    try {
      // --- Step 1: image upload (skipped if already done) --------------------
      let resolvedImageUri = imageUri;
      if (!resolvedImageUri) {
        setStep("compressing");
        const compressed = await compressImageForUpload(imageFile);

        if (!isPremium && compressed.size > 95 * 1024) {
          setFundingNotice(true);
        }

        setStep("uploading-image");

        if (isPremium) {
          resolvedImageUri = await platformUpload(compressed, compressed.type);
        } else {
          const bytes = new Uint8Array(await compressed.arrayBuffer());
          const result = await walletUpload(bytes, compressed.type);
          resolvedImageUri = result.uri;
        }

        setImageUri(resolvedImageUri);
      }

      // --- Step 2: metadata JSON upload --------------------------------------
      setStep("uploading-json");
      const metadataJson = JSON.stringify({
        name,
        symbol,
        description,
        image: resolvedImageUri,
      });

      let metadataUri: string;
      if (isPremium) {
        const jsonBlob = new Blob([metadataJson], { type: "application/json" });
        metadataUri = await platformUpload(jsonBlob, "application/json");
      } else {
        const jsonBytes = new TextEncoder().encode(metadataJson);
        const jsonResult = await walletUpload(jsonBytes, "application/json");
        metadataUri = jsonResult.uri;
      }

      setStep("done");
      onChange({ name, symbol, uri: metadataUri });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
      onChange(undefined);
    }
  }, [imageFile, imageUri, name, symbol, description, isPremium, platformUpload, walletUpload, onChange]);

  const isBusy = step === "compressing" || step === "uploading-image" || step === "uploading-json";

  return (
    <div className="space-y-3">
      {isPremium && (
        <p className="text-xs font-medium text-indigo-700">
          ★ Premium — uploads funded by Smeltr, no wallet transaction required.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium">Token name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); resetUploadState(); }}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm"
          maxLength={32}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => { setSymbol(e.target.value); resetUploadState(); }}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm"
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); resetUploadState(); }}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Logo image</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            setImageFile(e.target.files?.[0] ?? null);
            setImageUri(null);
            setFundingNotice(false);
            resetUploadState();
          }}
          className="mt-1 block w-full text-sm"
        />
        {!isPremium && (
          <p className="text-xs text-gray-500">
            Square images under ~95KB upload for free. Larger images may require
            a small additional SOL transfer to fund storage.
          </p>
        )}
      </div>

      {fundingNotice && (
        <p className="text-xs text-amber-700">
          This image exceeds the free-upload threshold — uploading it may
          prompt an additional wallet transaction to fund storage costs.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={runUpload}
        disabled={!imageFile || !name || !symbol || isBusy}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {step === "compressing" && "Compressing image…"}
        {step === "uploading-image" && "Uploading image…"}
        {step === "uploading-json" && "Uploading metadata…"}
        {step === "done" && "Uploaded ✓"}
        {(step === "idle" || step === "error") && (imageUri ? "Retry metadata upload" : "Upload metadata")}
      </button>
    </div>
  );
}
