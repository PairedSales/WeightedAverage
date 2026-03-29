import { toCanvas } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

const PREF_KEY = "wa-remember-location";

export function getRememberLocation(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
}

export function setRememberLocation(value: boolean) {
  localStorage.setItem(PREF_KEY, String(value));
}

// ── Filename generation ──────────────────────────────────────────

function generateFilename(numComps: number, ext: "webp" | "png"): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `weighted-avg-${numComps}comps-${yyyy}-${mm}-${dd}.${ext}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to create ${type} blob`));
      },
      type,
      quality
    );
  });
}

/** Prefer WebP; fall back to PNG when the browser returns null from toBlob. */
async function renderGridBlob(
  element: HTMLElement
): Promise<{ blob: Blob; ext: "webp" | "png" }> {
  const canvas = await toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
  });

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.95);
  });
  if (webpBlob) {
    return { blob: webpBlob, ext: "webp" };
  }

  const pngBlob = await canvasToBlob(canvas, "image/png");
  return { blob: pngBlob, ext: "png" };
}

// ── Public API ───────────────────────────────────────────────────

export interface SaveResult {
  success: boolean;
  usedRemembered: boolean;
}

/**
 * Save the element as WebP when supported, otherwise PNG.
 */
export async function saveGridAsImage(
  element: HTMLElement,
  _rememberLocation: boolean,
  numComps: number
): Promise<SaveResult> {
  const { blob, ext } = await renderGridBlob(element);
  const filename = generateFilename(numComps, ext);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, usedRemembered: false };
}
