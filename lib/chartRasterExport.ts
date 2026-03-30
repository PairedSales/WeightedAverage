import { toCanvas } from "html-to-image";

const EXPORT_BG = { r: 255, g: 255, b: 255 } as const;
const EXPORT_BG_CSS = "#ffffff";

function exportFilter(node: HTMLElement): boolean {
  if (node.hasAttribute("data-exclude-export")) {
    return false;
  }
  return true;
}

function getHtmlToImageBaseOptions() {
  return {
    pixelRatio: 2,
    backgroundColor: EXPORT_BG_CSS,
    filter: exportFilter,
    skipFonts: true,
  } as const;
}

function getExportDimensions(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height)),
  };
}

async function waitForStableFrame(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  await waitForStableFrame();
  const { width, height } = getExportDimensions(element);

  return toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    style: {
      margin: "0",
    },
  });
}

/**
 * Crops uniform background margins from the raster so exports have no extra whitespace.
 */
export function trimCanvasToContent(
  canvas: HTMLCanvasElement,
  bg: { r: number; g: number; b: number } = EXPORT_BG,
  tolerance = 10
): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas;

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, width, height);
  } catch {
    return canvas;
  }

  const data = imgData.data;

  const isBg = (i: number) => {
    const a = data[i + 3];
    if (a < 248) return false;
    return (
      Math.abs(data[i] - bg.r) <= tolerance &&
      Math.abs(data[i + 1] - bg.g) <= tolerance &&
      Math.abs(data[i + 2] - bg.b) <= tolerance
    );
  };

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isBg(i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return canvas;
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d");
  if (!octx) return canvas;
  octx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
  return out;
}

export async function captureChartForExport(element: HTMLElement): Promise<HTMLCanvasElement> {
  const raw = await captureElementToCanvas(element);
  return trimCanvasToContent(raw);
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
