import { toPng } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

export async function copyGridAsImage(
  element: HTMLElement
): Promise<boolean> {
  try {
    const dataUrl = await toPng(element, {
      ...getHtmlToImageBaseOptions(),
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);

    return true;
  } catch {
    return false;
  }
}
