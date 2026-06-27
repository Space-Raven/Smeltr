const MAX_UPLOAD_BYTES = 95 * 1024; // safely under Irys's 100KiB free-upload threshold
const MAX_DIMENSION = 512; // px — generous for a token icon

/**
 * Resizes/recompresses an image client-side until it fits under
 * MAX_UPLOAD_BYTES, to avoid triggering Irys's funding flow for the
 * common case of a token logo upload. Returns the original file unchanged
 * if it's already small enough.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  for (let quality = 0.9; quality >= 0.4; quality -= 0.1) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], renameToWebp(file.name), { type: "image/webp" });
    }
  }

  // Couldn't hit the target — return the smallest attempt; caller decides
  // whether to proceed (with the funding-notice path) or ask for a smaller image.
  const fallback = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.4)
  );
  if (!fallback) throw new Error("Image compression failed");
  return new File([fallback], renameToWebp(file.name), { type: "image/webp" });
}

function renameToWebp(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".webp";
}
