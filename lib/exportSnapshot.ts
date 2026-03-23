/**
 * Exclude nodes from html-to-image capture (toolbar, options, remove buttons, etc.).
 */
export function exportFilter(node: HTMLElement): boolean {
  if (node.hasAttribute("data-exclude-export")) {
    return false;
  }
  return true;
}

/** Shared options for toPng / toCanvas */
export function getHtmlToImageBaseOptions() {
  return {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    filter: exportFilter,
  } as const;
}
