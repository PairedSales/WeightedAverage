import { toPng } from "html-to-image";
import {
  captureChartForExport,
  canvasToBlob,
  getHtmlToImageExportOptions,
} from "./chartRasterExport";

export type CopyFailureReason = "no_element" | "unsupported" | "capture_failed" | "clipboard_denied";

export type CopyResult =
  | { ok: true }
  | { ok: false; reason: CopyFailureReason; message?: string };

async function capturePngBlob(element: HTMLElement): Promise<Blob> {
  try {
    const canvas = await captureChartForExport(element);
    return await canvasToBlob(canvas, "image/png");
  } catch (first) {
    try {
      const dataUrl = await toPng(element, { ...getHtmlToImageExportOptions() });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch {
      throw first instanceof Error ? first : new Error(String(first));
    }
  }
}

/**
 * Copies the chart as PNG for word processors. Uses ClipboardItem with a Promise so
 * navigator.clipboard.write runs in the same synchronous turn as the call (user gesture).
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

  const pngPromise = (async (): Promise<Blob> => {
    try {
      return await capturePngBlob(element);
    } catch (e) {
      captureFailed = true;
      throw e instanceof Error ? e : new Error(String(e));
    }
  })();

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngPromise,
      }),
    ]);
    return { ok: true };
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
