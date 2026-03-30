import { toCanvas } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

function getExportDimensions(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height)),
  };
}

export async function captureChartCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
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

export async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });

  if (!blob) {
    throw new Error(`Failed to create ${type} blob`);
  }

  return blob;
}
