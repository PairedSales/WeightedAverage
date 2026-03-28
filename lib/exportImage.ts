import { toPng } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

export async function copyGridAsImage(
  element: HTMLElement
): Promise<boolean> {
  try {
    if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
      return false;
    }

    if (typeof ClipboardItem === "undefined") {
      return false;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": (async () => {
          const dataUrl = await toPng(element, {
            ...getHtmlToImageBaseOptions(),
          });
          const res = await fetch(dataUrl);
          return await res.blob();
        })(),
      }),
    ]);

    return true;
  } catch {
    return false;
  }
}
