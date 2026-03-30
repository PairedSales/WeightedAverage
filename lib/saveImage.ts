import { captureChartCanvas, canvasToBlob } from "./chartExport";

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
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  return `weighted-avg-${numComps}comps-${yyyy}${mm}${dd}-${hh}${min}${sec}.webp`;
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

async function promptForDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: "weighted-average-save-dir",
      mode: "readwrite",
    });
    return handle;
  } catch {
    return null;
  }
}

async function writeFile(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveViaAnchor(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface SaveResult {
  success: boolean;
  canceled?: boolean;
}

export async function saveChartAsWebp(
  element: HTMLElement,
  rememberLocation: boolean,
  numComps: number
): Promise<SaveResult> {
  const canvas = await captureChartCanvas(element);
  const blob = await canvasToBlob(canvas, "image/webp", 0.95);
  const filename = generateFilename(numComps);

  const hasDirectoryPicker =
    typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

  if (!hasDirectoryPicker) {
    await saveViaAnchor(blob, filename);
    return { success: true };
  }

  let directoryHandle = rememberLocation ? await loadSavedDirectoryHandle() : null;

  if (!directoryHandle) {
    directoryHandle = await promptForDirectory();
    if (!directoryHandle) {
      return { success: false, canceled: true };
    }

    if (rememberLocation) {
      await saveDirectoryHandle(directoryHandle);
    }
  }

  const hasPermission = await ensureDirectoryPermission(directoryHandle);
  if (!hasPermission) {
    return { success: false };
  }

  const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
  await writeFile(fileHandle, blob);

  if (rememberLocation) {
    await saveDirectoryHandle(directoryHandle);
  }

  return { success: true };
}
