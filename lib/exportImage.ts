import { toPng } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

function pngBlobPromise(element: HTMLElement): Promise<Blob> {
  return (async () => {
    const dataUrl = await toPng(element, {
      ...getHtmlToImageBaseOptions(),
    });
    const res = await fetch(dataUrl);
    return res.blob();
  })();
}

/**
 * Writes PNG to the clipboard. Call from a click handler without awaiting anything
 * before this function so the browser keeps user activation for clipboard.write.
 */
export function copyGridAsImage(element: HTMLElement): Promise<boolean> {
  if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
    return Promise.resolve(false);
  }

  if (typeof ClipboardItem === "undefined") {
    return Promise.resolve(false);
  }

  const pngPromise = pngBlobPromise(element);

  return navigator.clipboard
    .write([new ClipboardItem({ "image/png": pngPromise })])
    .then(() => true)
    .catch(() => false);
}
