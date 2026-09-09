"use client";

import { useState, useEffect } from "react";

// In-memory cache of static base64 PNG data URLs so conversion runs once per URL
const staticImageCache = new Map<string, string>();

/**
 * Hook to load any avatar image (including GIFs) and freeze it into a static,
 * single-frame base64 PNG data URL. Prevents GIF animations, eliminates CORS issues,
 * and guarantees non-tainted canvas exports.
 */
export function useStaticAvatar(imageUrl?: string | null): {
  staticUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
} {
  const [staticUrl, setStaticUrl] = useState<string | null>(() => {
    if (!imageUrl) return null;
    return staticImageCache.get(imageUrl) || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(imageUrl && !staticImageCache.has(imageUrl)));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!imageUrl) {
      setStaticUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    if (staticImageCache.has(imageUrl)) {
      setStaticUrl(staticImageCache.get(imageUrl)!);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const convertViaFetch = async () => {
      try {
        const res = await fetch(imageUrl, { mode: "cors" });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          staticImageCache.set(imageUrl, dataUrl);
          if (isMounted) {
            setStaticUrl(dataUrl);
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          staticImageCache.set(imageUrl, dataUrl);
          if (isMounted) {
            setStaticUrl(dataUrl);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn("[Avatar] Canvas toDataURL tainted, falling back to fetch reader:", err);
      }
      convertViaFetch();
    };

    img.onerror = () => {
      convertViaFetch();
    };

    img.src = imageUrl;

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return { staticUrl, isLoading, hasError };
}
