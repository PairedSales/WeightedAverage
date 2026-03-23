import { toPng } from "html-to-image";

export async function copyGridAsImage(
  element: HTMLElement
): Promise<boolean> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      filter: (node) => {
        if (node instanceof HTMLElement && node.hasAttribute("data-exclude-export")) {
          return false;
        }
        return true;
      },
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
