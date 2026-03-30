import { toCanvas } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

async function renderPngBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
    canvasWidth: element.scrollWidth,
    canvasHeight: element.scrollHeight,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });

  if (!blob) {
    throw new Error("Unable to render PNG blob for clipboard copy");
  }

  return blob;
}

export async function copyGridAsImage(element: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    const pngBlob = await renderPngBlob(element);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    return true;
  } catch {
    return false;
  }
}
