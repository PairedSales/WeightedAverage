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

/** skipFonts avoids embedding Google Fonts into huge SVG data URLs (common capture failure on static hosts). cacheBust avoids stale CSS/font fetches on GitHub Pages. */
export function getHtmlToImageExportOptions() {
  return {
    pixelRatio: 2,
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
