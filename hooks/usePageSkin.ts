"use client";

import { useCallback, useEffect, useState } from "react";
import { isPageSkin, SKIN_STORAGE_KEY, type PageSkinId } from "@/lib/skins";

/** Active page skin, mirrored to <html data-skin> and localStorage["wa-skin"]. */
export function usePageSkin() {
  const [skin, setSkinState] = useState<PageSkinId>("classic");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SKIN_STORAGE_KEY);
      if (isPageSkin(saved)) setSkinState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setSkin = useCallback((next: PageSkinId) => {
    setSkinState(next);
    document.documentElement.setAttribute("data-skin", next);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { skin, setSkin };
}
