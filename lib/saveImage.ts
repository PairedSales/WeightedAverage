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

function generateFilename(numComps: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `weighted-avg-${numComps}comps-${yyyy}-${mm}-${dd}.webp`;
}

// ── Render the element to a WebP blob ────────────────────────────

async function renderToWebpBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create WebP blob"));
      },
      "image/webp",
      0.95
    );
  });
}

// ── Public API ───────────────────────────────────────────────────

export interface SaveResult {
  success: boolean;
  usedRemembered: boolean;
}

/**
 * Save the element as a WebP image file.
 */
export async function saveGridAsImage(
  element: HTMLElement,
  _rememberLocation: boolean,
  numComps: number
): Promise<SaveResult> {
  const filename = generateFilename(numComps);

  const blob = await renderToWebpBlob(element);

  // Trigger a download via <a> tag.
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
