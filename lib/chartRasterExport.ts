import { toCanvas } from "html-to-image";

const EXPORT_BG_CSS = "#ffffff";

function exportFilter(node: HTMLElement): boolean {
  if (node.hasAttribute("data-exclude-export")) {
    return false;
  }
  return true;
}

/** Matches first working export path (93be7b5): pixelRatio, background, filter only — no skipFonts or forced dimensions. */
function getHtmlToImageBaseOptions() {
  return {
    pixelRatio: 2,
    backgroundColor: EXPORT_BG_CSS,
    filter: exportFilter,
  } as const;
}

export async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
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
