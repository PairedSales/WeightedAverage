import { captureChartForExport, canvasToBlob } from "./chartRasterExport";

export type CopyFailureReason = "no_element" | "unsupported" | "capture_failed" | "clipboard_denied";

export type CopyResult =
  | { ok: true }
  | { ok: false; reason: CopyFailureReason; message?: string };

/**
 * Copies the chart as PNG for word processors. Uses ClipboardItem with a Promise so
 * navigator.clipboard.write runs in the same synchronous turn as the call (user gesture).
 */
export async function copyChartImageToClipboard(element: HTMLElement | null): Promise<CopyResult> {
  if (!element) {
    return { ok: false, reason: "no_element" };
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return { ok: false, reason: "unsupported", message: "Clipboard image write is not available" };
  }

  let captureFailed = false;

  const pngPromise = (async (): Promise<Blob> => {
    try {
      const canvas = await captureChartForExport(element);
      return await canvasToBlob(canvas, "image/png");
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
      return { ok: false, reason: "capture_failed", message };
    }
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "clipboard_denied", message };
  }
}
