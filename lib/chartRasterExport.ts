import { toCanvas } from "html-to-image";

const EXPORT_BG_CSS = "#ffffff";

/**
 * html-to-image passes every cloned node through `filter`, including text nodes and
 * other non-Element nodes — they do not have `hasAttribute`.
 */
export function exportFilter(node: unknown): boolean {
  if (!(node instanceof Element)) {
    return true;
  }
  if (node.hasAttribute("data-exclude-export")) {
    return false;
  }
  return true;
}

/**
 * Exports are WYSIWYG: the image comes out the same size the table appears on screen.
 *
 * html-to-image measures the element in CSS pixels, so the scale factor has to be
 * "physical pixels per CSS pixel" — i.e. `devicePixelRatio`. Chrome folds page zoom
 * into that value (150% zoom on a 1x display reports 1.5), so zooming in produces a
 * proportionally larger export with no extra work. Clamped to keep a bad/absurd
 * ratio from producing a canvas the browser refuses to allocate.
 */
export function getExportPixelRatio(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  if (!Number.isFinite(raw) || raw <= 0) {
    return 1;
  }
  return Math.min(Math.max(raw, 1), 4);
}

/** skipFonts avoids embedding Google Fonts into huge SVG data URLs (common capture failure on static hosts). cacheBust avoids stale CSS/font fetches on GitHub Pages. */
export function getHtmlToImageExportOptions() {
  return {
    pixelRatio: getExportPixelRatio(),
    backgroundColor: EXPORT_BG_CSS,
    filter: exportFilter,
    skipFonts: true,
    cacheBust: true,
  } as const;
}

export async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(element, {
    ...getHtmlToImageExportOptions(),
  });
}

export async function captureChartForExport(element: HTMLElement): Promise<HTMLCanvasElement> {
  return captureElementToCanvas(element);
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });

  if (!blob) {
    throw new Error(`Failed to create ${type} blob`);
  }

  return blob;
}
