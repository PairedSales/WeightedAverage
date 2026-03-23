import { toPng } from "html-to-image";

const DB_NAME = "wa-filehandles";
const STORE_NAME = "handles";
const HANDLE_KEY = "save-image-handle";
const PREF_KEY = "wa-remember-location";

// ── IndexedDB helpers for persisting the FileSystemFileHandle ──────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
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
    clearHandle();
  }
}

// ── File System Access API detection ──────────────────────────────

function supportsFilePicker(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

// ── Render the element to a PNG blob ──────────────────────────────

const exportFilter = (node: Node) => {
  if (node instanceof HTMLElement && node.hasAttribute("data-exclude-export")) {
    return false;
  }
  return true;
};

async function renderToBlob(element: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    filter: exportFilter,
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

// ── Verify or request write permission on a stored handle ─────────

async function verifyPermission(
  handle: FileSystemFileHandle
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

// ── Public API ────────────────────────────────────────────────────

export interface SaveResult {
  success: boolean;
  usedRemembered: boolean;
}

/**
 * Save the element as a PNG image file.
 *
 * If `rememberLocation` is true and a saved handle exists, writes
 * directly to the previously chosen file. Otherwise shows the
 * save-file picker (or falls back to a download link).
 */
export async function saveGridAsImage(
  element: HTMLElement,
  rememberLocation: boolean
): Promise<SaveResult> {
  const blob = await renderToBlob(element);

  // Try to reuse remembered handle
  if (rememberLocation && supportsFilePicker()) {
    const handle = await loadHandle();
    if (handle) {
      try {
        const ok = await verifyPermission(handle);
        if (ok) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return { success: true, usedRemembered: true };
        }
      } catch {
        // Handle expired or revoked — fall through to picker
      }
    }
  }

  // Show file picker (File System Access API)
  if (supportsFilePicker()) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "weighted-average.png",
        types: [
          {
            description: "PNG Image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      // Persist the handle for future saves
      await storeHandle(handle);

      return { success: true, usedRemembered: false };
    } catch (err) {
      // User cancelled the dialog
      if (err instanceof DOMException && err.name === "AbortError") {
        return { success: false, usedRemembered: false };
      }
      throw err;
    }
  }

  // Fallback: trigger a download via <a> tag
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "weighted-average.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, usedRemembered: false };
}
