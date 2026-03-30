import { captureChartCanvas, canvasToBlob } from "./chartExport";

async function writeBlobToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function copyChartAsImage(element: HTMLElement): Promise<boolean> {
  try {
    const canvas = await captureChartCanvas(element);
    const pngBlob = await canvasToBlob(canvas, "image/png");
    return writeBlobToClipboard(pngBlob);
  } catch {
    return false;
  }
}
