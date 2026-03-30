import { toCanvas } from "html-to-image";
import { getHtmlToImageBaseOptions } from "./exportSnapshot";

const PREF_KEY = "wa-remember-location";
const DB_NAME = "weighted-average";
const DB_VERSION = 1;
const STORE = "settings";
const DIRECTORY_HANDLE_KEY = "save-directory-handle";

export function getRememberLocation(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
}

export function setRememberLocation(value: boolean) {
  localStorage.setItem(PREF_KEY, String(value));
}

function generateFilename(numComps: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `weighted-avg-${numComps}comps-${yyyy}-${mm}-${dd}.webp`;
}

async function renderWebpBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await toCanvas(element, {
    ...getHtmlToImageBaseOptions(),
    canvasWidth: element.scrollWidth,
    canvasHeight: element.scrollHeight,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.95);
  });

  if (!blob) {
    throw new Error("Failed to create WEBP blob");
  }

  return blob;
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
      const store = tx.objectStore(STORE);
      const req = store.get(DIRECTORY_HANDLE_KEY);
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

  const query = await handle.queryPermission({ mode: "readwrite" });
  if (query === "granted") return true;

  const request = await handle.requestPermission({ mode: "readwrite" });
  return request === "granted";
}

async function writeFile(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveViaAnchor(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface SaveResult {
  success: boolean;
  usedRemembered: boolean;
}

export async function saveGridAsImage(
  element: HTMLElement,
  rememberLocation: boolean,
  numComps: number
): Promise<SaveResult> {
  const blob = await renderWebpBlob(element);
  const filename = generateFilename(numComps);

  const hasPickerSupport =
    typeof window !== "undefined" &&
    typeof window.showSaveFilePicker === "function" &&
    typeof window.showDirectoryPicker === "function";

  if (!hasPickerSupport) {
    await saveViaAnchor(blob, filename);
    return { success: true, usedRemembered: false };
  }

  if (rememberLocation) {
    let dirHandle = await loadSavedDirectoryHandle();

    if (!dirHandle) {
      dirHandle = await window.showDirectoryPicker({
        id: "weighted-average-save-dir",
        mode: "readwrite",
      });
      await saveDirectoryHandle(dirHandle);
    }

    const granted = await ensureDirectoryPermission(dirHandle);
    if (!granted) {
      return { success: false, usedRemembered: true };
    }

    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    await writeFile(fileHandle, blob);
    return { success: true, usedRemembered: true };
  }

  const fileHandle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [
      {
        description: "WEBP image",
        accept: { "image/webp": [".webp"] },
      },
    ],
  });

  await writeFile(fileHandle, blob);
  return { success: true, usedRemembered: false };
}
