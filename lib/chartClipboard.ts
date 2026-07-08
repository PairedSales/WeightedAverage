import { toPng } from "html-to-image";
import {
  captureChartForExport,
  canvasToBlob,
  getHtmlToImageExportOptions,
} from "./chartRasterExport";

export type CopyFailureReason = "no_element" | "unsupported" | "capture_failed" | "clipboard_denied";

export type CopyResult =
  | { ok: true; image?: string }
  | { ok: false; reason: CopyFailureReason; message?: string };

interface Captured {
  /** PNG blob written to the clipboard (best fidelity for word processors). */
  blob: Blob;
  /** Data URL stored in history — WebP to keep localStorage small, PNG on fallback path. */
  image: string;
}

async function captureForCopy(element: HTMLElement): Promise<Captured> {
  try {
    const canvas = await captureChartForExport(element);
    const blob = await canvasToBlob(canvas, "image/png");
    const image = canvas.toDataURL("image/webp", 0.7);
    return { blob, image };
  } catch (first) {
    try {
      const dataUrl = await toPng(element, { ...getHtmlToImageExportOptions() });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, image: dataUrl };
    } catch {
      throw first instanceof Error ? first : new Error(String(first));
    }
  }
}

/**
 * Copies the chart as PNG for word processors. Uses ClipboardItem with a Promise so
 * navigator.clipboard.write runs in the same synchronous turn as the call (user gesture).
 * On success also returns a data-URL image of the exact grid for the history strip.
 */
export async function copyChartImageToClipboard(element: HTMLElement | null): Promise<CopyResult> {
  if (!element) {
    console.error("[WeightedAverage] Copy failed: no_element");
    return { ok: false, reason: "no_element" };
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    console.error("[WeightedAverage] Copy failed: unsupported (clipboard image write unavailable)");
    return { ok: false, reason: "unsupported", message: "Clipboard image write is not available" };
  }

  let captureFailed = false;

  const capturePromise = (async (): Promise<Captured> => {
    try {
      return await captureForCopy(element);
    } catch (e) {
      captureFailed = true;
      throw e instanceof Error ? e : new Error(String(e));
    }
  })();

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": capturePromise.then((c) => c.blob),
      }),
    ]);
    // capturePromise has already resolved (clipboard consumed its blob); await returns the cached value.
    const { image } = await capturePromise;
    return { ok: true, image };
  } catch (e) {
    if (captureFailed) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[WeightedAverage] Copy failed: capture_failed", message);
      return { ok: false, reason: "capture_failed", message };
    }
    const message = e instanceof Error ? e.message : String(e);
    console.error("[WeightedAverage] Copy failed: clipboard_denied", message);
    return { ok: false, reason: "clipboard_denied", message };
  }
}
