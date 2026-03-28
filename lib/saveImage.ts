import { toCanvas } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

const DB_NAME = "wa-filehandles";
const STORE_NAME = "handles";
const DIR_HANDLE_KEY = "save-dir-handle";
const PREF_KEY = "wa-remember-location";

// ── IndexedDB helpers for persisting the FileSystemDirectoryHandle ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, DIR_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(DIR_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearDirHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(DIR_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

// ── Preferences ───────────────────────────────────────────────────

export function getRememberLocation(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
}

export function setRememberLocation(value: boolean) {
  localStorage.setItem(PREF_KEY, String(value));
  if (!value) {
    clearDirHandle();
  }
}

// ── Filename generation ──────────────────────────────────────────

function generateFilename(numComps: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `weighted-avg-${numComps}comps-${yyyy}-${mm}-${dd}.webp`;
}

// ── File System Access API detection ─────────────────────────────

function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// ── Render the element to a WebP blob ────────────────────────────

async function renderToWebpBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create WebP blob"));
      },
      "image/webp",
      0.95
    );
  });
}

// ── Verify or request write permission on a stored handle ────────

async function verifyPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

async function writeToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// ── Public API ───────────────────────────────────────────────────

export interface SaveResult {
  success: boolean;
  usedRemembered: boolean;
}

/**
 * Save the element as a WebP image file.
 *
 * If `rememberLocation` is true and a saved directory handle exists,
 * writes a new file into the remembered directory. Otherwise shows the
 * directory picker (or falls back to a download link).
 *
 * Filename format: `weighted-avg-{numComps}comps-{YYYY-MM-DD}.webp`
 */
export async function saveGridAsImage(
  element: HTMLElement,
  rememberLocation: boolean,
  numComps: number
): Promise<SaveResult> {
  const filename = generateFilename(numComps);
  let targetDirHandle: FileSystemDirectoryHandle | null = null;
  let usedRemembered = false;

  // Try to reuse remembered directory
  if (rememberLocation && supportsDirectoryPicker()) {
    const dirHandle = await loadDirHandle();
    if (dirHandle) {
      try {
        const ok = await verifyPermission(dirHandle);
        if (ok) {
          targetDirHandle = dirHandle;
          usedRemembered = true;
        }
      } catch {
        // Handle expired or revoked — fall through to picker
      }
    }
  }

  // If no remembered directory is available, prompt user first while
  // the click gesture is still active.
  if (!targetDirHandle && supportsDirectoryPicker()) {
    try {
      targetDirHandle = await window.showDirectoryPicker({
        mode: "readwrite",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { success: false, usedRemembered: false };
      }
      throw err;
    }
  }

  const blob = await renderToWebpBlob(element);

  if (targetDirHandle) {
    await writeToDirectory(targetDirHandle, filename, blob);
    await storeDirHandle(targetDirHandle);
    return { success: true, usedRemembered };
  }

  // Fallback: trigger a download via <a> tag
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, usedRemembered: false };
}
