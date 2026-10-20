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

/** The sheet's own background (it follows the page skin, e.g. dark for Midnight), else white. */
function exportBackground(element?: HTMLElement): string {
  if (!element) return EXPORT_BG_CSS;
  const bg = getComputedStyle(element).backgroundColor;
  return bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" ? bg : EXPORT_BG_CSS;
}

/** skipFonts avoids embedding Google Fonts into huge SVG data URLs (common capture failure on static hosts). cacheBust avoids stale CSS/font fetches on GitHub Pages. */
export function getHtmlToImageExportOptions(element?: HTMLElement) {
  return {
    pixelRatio: 2,
    backgroundColor: exportBackground(element),
    filter: exportFilter,
    skipFonts: true,
    cacheBust: true,
  } as const;
}

export async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(element, {
    ...getHtmlToImageExportOptions(element),
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
