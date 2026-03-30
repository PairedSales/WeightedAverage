import { captureChartForExport, canvasToBlob } from "./chartRasterExport";

const PREF_KEY = "wa-remember-location";
const DB_NAME = "weighted-average";
const DB_VERSION = 1;
const STORE = "settings";
const DIRECTORY_HANDLE_KEY = "save-directory-handle";

export type ChartToolId = "weightedAverage" | "sensitivityAnalysis";

export function getRememberLocation(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
}

async function clearSavedDirectoryHandle(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Failed clearing directory handle"));
      };
      tx.objectStore(STORE).delete(DIRECTORY_HANDLE_KEY);
    });
  } catch {
    /* ignore */
  }
}

export function setRememberLocation(value: boolean) {
  localStorage.setItem(PREF_KEY, String(value));
  if (!value) {
    void clearSavedDirectoryHandle();
  }
}

function generateFilename(activeTool: ChartToolId, numComps: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  const prefix = activeTool === "sensitivityAnalysis" ? "sensitivity" : "weighted-avg";
  return `${prefix}-${numComps}comps-${yyyy}${mm}${dd}-${hh}${min}${sec}.webp`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function loadSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined") return null;

  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(DIRECTORY_HANDLE_KEY);

      req.onsuccess = () => {
        resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
        db.close();
      };
      req.onerror = () => {
        reject(req.error ?? new Error("Failed reading directory handle"));
        db.close();
      };
    });
  } catch {
    return null;
  }
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  if (typeof window === "undefined") return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Failed saving directory handle"));
    };
    tx.objectStore(STORE).put(handle, DIRECTORY_HANDLE_KEY);
  });
}

async function ensureDirectoryPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true;

  const queryState = await handle.queryPermission({ mode: "readwrite" });
  if (queryState === "granted") return true;

  const requestState = await handle.requestPermission({ mode: "readwrite" });
  return requestState === "granted";
}

type DirPickResult =
  | { kind: "ok"; handle: FileSystemDirectoryHandle }
  | { kind: "abort" }
  | { kind: "error"; message: string };

async function promptForDirectory(): Promise<DirPickResult> {
  if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
    return { kind: "error", message: "Directory picker is not available in this browser." };
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: "weighted-average-save-dir",
      mode: "readwrite",
    });
    return { kind: "ok", handle };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { kind: "abort" };
    }
    console.error("[WeightedAverage] showDirectoryPicker failed:", e);
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

type FilePickResult =
  | { kind: "ok"; handle: FileSystemFileHandle }
  | { kind: "abort" }
  | { kind: "error"; message: string };

async function promptSaveFile(suggestedName: string): Promise<FilePickResult> {
  if (typeof window === "undefined" || typeof window.showSaveFilePicker !== "function") {
    return { kind: "error", message: "Save file picker is not available." };
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "WebP image",
          accept: { "image/webp": [".webp"] },
        },
        {
          description: "PNG image",
          accept: { "image/png": [".png"] },
        },
      ],
    });
    return { kind: "ok", handle };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { kind: "abort" };
    }
    console.error("[WeightedAverage] showSaveFilePicker failed:", e);
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

async function writeFile(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** WebKit without File System Access: open blob in a tab so the user can save manually. */
function saveViaAnchorOrFallback(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const safariLike = /Safari\//.test(ua) && !/Chrom(e|ium)/.test(ua);
  const noModernFs =
    typeof window.showSaveFilePicker !== "function" &&
    typeof window.showDirectoryPicker !== "function";

  if (noModernFs && safariLike) {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
  }

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("[WeightedAverage] Programmatic download failed:", e);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return false;
}

async function blobWebpOrPng(
  canvas: HTMLCanvasElement,
  preferredWebpName: string
): Promise<{ blob: Blob; filename: string }> {
  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.95);
  });
  if (webpBlob) {
    return { blob: webpBlob, filename: preferredWebpName };
  }
  const pngBlob = await canvasToBlob(canvas, "image/png");
  const pngName = preferredWebpName.replace(/\.webp$/i, ".png");
  return { blob: pngBlob, filename: pngName };
}

export interface SaveResult {
  success: boolean;
  canceled?: boolean;
  /** User-visible or logged detail when success is false */
  errorMessage?: string;
  /** True when the image was opened in a new tab (Safari-style fallback) */
  openedInNewTab?: boolean;
}

/**
 * Saves the chart as WebP (PNG fallback if encoding unsupported).
 * Prefers showSaveFilePicker when not using a remembered folder; otherwise directory picker or anchor/WebKit fallback.
 */
export async function saveChartAsWebp(
  element: HTMLElement,
  rememberLocation: boolean,
  numComps: number,
  activeTool: ChartToolId
): Promise<SaveResult> {
  const preferredName = generateFilename(activeTool, numComps);

  const hasSaveFilePicker =
    typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
  const hasDirectoryPicker =
    typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

  let directoryHandle: FileSystemDirectoryHandle | null = null;

  if (rememberLocation) {
    const stored = await loadSavedDirectoryHandle();
    if (stored && (await ensureDirectoryPermission(stored))) {
      directoryHandle = stored;
    }
  }

  if (directoryHandle) {
    const permitted = await ensureDirectoryPermission(directoryHandle);
    if (!permitted) {
      return { success: false, errorMessage: "Folder permission denied" };
    }
    const canvas = await captureChartForExport(element);
    const { blob, filename } = await blobWebpOrPng(canvas, preferredName);
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    await writeFile(fileHandle, blob);
    if (rememberLocation) {
      await saveDirectoryHandle(directoryHandle);
    }
    return { success: true };
  }

  if (!rememberLocation && hasSaveFilePicker) {
    const filePick = await promptSaveFile(preferredName);
    if (filePick.kind === "abort") {
      return { success: false, canceled: true };
    }
    if (filePick.kind === "error") {
      return { success: false, errorMessage: filePick.message };
    }
    const canvas = await captureChartForExport(element);
    const name = filePick.handle.name.toLowerCase();
    const blob = name.endsWith(".png")
      ? await canvasToBlob(canvas, "image/png")
      : (await blobWebpOrPng(canvas, preferredName)).blob;
    await writeFile(filePick.handle, blob);
    return { success: true };
  }

  if (hasDirectoryPicker) {
    const dirPick = await promptForDirectory();
    if (dirPick.kind === "abort") {
      return { success: false, canceled: true };
    }
    if (dirPick.kind === "error") {
      return { success: false, errorMessage: dirPick.message };
    }
    directoryHandle = dirPick.handle;
    if (rememberLocation) {
      await saveDirectoryHandle(directoryHandle);
    }
    const permitted = await ensureDirectoryPermission(directoryHandle);
    if (!permitted) {
      return { success: false, errorMessage: "Folder permission denied" };
    }
    const canvas = await captureChartForExport(element);
    const { blob, filename } = await blobWebpOrPng(canvas, preferredName);
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    await writeFile(fileHandle, blob);
    if (rememberLocation) {
      await saveDirectoryHandle(directoryHandle);
    }
    return { success: true };
  }

  try {
    const canvas = await captureChartForExport(element);
    const { blob, filename } = await blobWebpOrPng(canvas, preferredName);
    const openedInNewTab = saveViaAnchorOrFallback(blob, filename);
    return { success: true, openedInNewTab };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[WeightedAverage] Save failed (anchor path):", e);
    return { success: false, errorMessage: message };
  }
}
