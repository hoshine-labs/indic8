"use client";

import React, { useEffect, useRef, useState } from "react";

type DrawCallback = (frame: CanvasImageSource | null) => void;

interface DecodedFrame {
  bitmap: CanvasImageSource;
  duration: number; // in milliseconds
}

class MasterGifBroadcaster {
  private static instances = new Map<string, MasterGifBroadcaster>();

  public static getInstance(src: string): MasterGifBroadcaster {
    let instance = this.instances.get(src);
    if (!instance) {
      instance = new MasterGifBroadcaster(src);
      this.instances.set(src, instance);
    }
    return instance;
  }

  public src: string;
  public isLoaded = false;
  public hasError = false;
  private subscribers = new Set<DrawCallback>();
  private rafId: number | null = null;
  private frames: DecodedFrame[] = [];
  private totalDuration = 0;
  private startTime = 0;
  private staticImage: HTMLImageElement | null = null;

  constructor(src: string) {
    this.src = src;
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private async init() {
    this.startTime = performance.now();
    const isLikelyAnimated =
      this.src.startsWith("data:image/gif") ||
      this.src.startsWith("data:image/webp") ||
      this.src.toLowerCase().includes(".gif") ||
      this.src.toLowerCase().includes(".webp");

    if (isLikelyAnimated && typeof window !== "undefined" && "ImageDecoder" in window) {
      try {
        const response = await fetch(this.src);
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "image/gif";
          const buffer = await response.arrayBuffer();

          const decoder = new (window as any).ImageDecoder({
            data: buffer,
            type: contentType.includes("webp") ? "image/webp" : "image/gif",
          });

          await decoder.tracks.ready;
          const track = decoder.tracks.selectedTrack;
          const count = track?.frameCount || 1;

          if (count > 1) {
            const decoded: DecodedFrame[] = [];
            let total = 0;

            for (let i = 0; i < count; i++) {
              const result = await decoder.decode({ frameIndex: i });
              const durMs = result.image.duration ? result.image.duration / 1000 : 100;
              decoded.push({
                bitmap: result.image,
                duration: durMs,
              });
              total += durMs;
            }

            if (decoded.length > 0) {
              this.frames = decoded;
              this.totalDuration = total > 0 ? total : 1000;
              this.isLoaded = true;
              this.hasError = false;
              this.broadcast();
              if (this.subscribers.size > 0 && !this.rafId && this.frames.length > 1) {
                this.startLoop();
              }
              return;
            }
          }
        }
      } catch {
        // Silently fall through to standard Image element fallback
      }
    }

    // 2. Fallback to standard Image element
    this.staticImage = new Image();
    this.staticImage.crossOrigin = "anonymous";
    this.staticImage.onload = () => {
      this.isLoaded = true;
      this.hasError = false;
      this.broadcast();
    };
    this.staticImage.onerror = () => {
      this.hasError = true;
      this.broadcast();
    };
    this.staticImage.src = this.src;
  }

  public subscribe(cb: DrawCallback) {
    this.subscribers.add(cb);
    if (this.isLoaded) {
      cb(this.getCurrentFrame());
      if (this.frames.length > 1 && !this.rafId) {
        this.startLoop();
      }
    }
  }

  public unsubscribe(cb: DrawCallback) {
    this.subscribers.delete(cb);
    if (this.subscribers.size === 0 && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private startLoop() {
    const loop = () => {
      this.broadcast();
      if (this.subscribers.size > 0 && this.frames.length > 1) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private getCurrentFrame(): CanvasImageSource | null {
    if (!this.isLoaded) return null;
    if (this.frames.length === 0) {
      return this.staticImage;
    }
    if (this.frames.length === 1 || this.totalDuration === 0) {
      return this.frames[0].bitmap;
    }

    const elapsed = (performance.now() - this.startTime) % this.totalDuration;
    let accumulated = 0;
    for (const frame of this.frames) {
      accumulated += frame.duration;
      if (elapsed < accumulated) {
        return frame.bitmap;
      }
    }
    return this.frames[0].bitmap;
  }

  private broadcast() {
    const frame = this.getCurrentFrame();
    this.subscribers.forEach((cb) => cb(frame));
  }
}

import { LocalPreferences } from "@/lib/storage/localPreferences";

interface SyncedAvatarProps {
  src?: string | null;
  alt?: string;
  crop?: { zoom: number; panX: number; panY: number };
  fallbackText?: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
  fallbackClassName?: string;
}

export const SyncedAvatar: React.FC<SyncedAvatarProps> = ({
  src,
  alt = "User Avatar",
  crop,
  fallbackText,
  fallbackIcon,
  className = "w-full h-full",
  fallbackClassName = "w-full h-full flex items-center justify-center bg-surface-subtle text-brand-primary font-bold text-xs",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [localCrop, setLocalCrop] = useState<{ zoom: number; panX: number; panY: number } | undefined>(undefined);

  useEffect(() => {
    const updateLocalCrop = () => {
      setLocalCrop(LocalPreferences.get("customAvatarCrop"));
    };
    updateLocalCrop();
    window.addEventListener("indic8_profile_updated", updateLocalCrop);
    window.addEventListener("storage", updateLocalCrop);
    return () => {
      window.removeEventListener("indic8_profile_updated", updateLocalCrop);
      window.removeEventListener("storage", updateLocalCrop);
    };
  }, []);

  const activeCrop = crop ?? localCrop;
  const activeCropRef = useRef(activeCrop);
  activeCropRef.current = activeCrop;

  useEffect(() => {
    if (!src) {
      setLoadError(false);
      return;
    }

    const broadcaster = MasterGifBroadcaster.getInstance(src);

    const onFrame = (frame: CanvasImageSource | null) => {
      if (broadcaster.hasError) {
        setLoadError(true);
        return;
      }
      if (!frame) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.max(1, Math.round(rect.width || canvas.clientWidth || 32));
      const displayHeight = Math.max(1, Math.round(rect.height || canvas.clientHeight || 32));

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Object-fit: cover logic with user's zoom & pan
      const sw = (frame as any).width || (frame as any).naturalWidth || displayWidth;
      const sh = (frame as any).height || (frame as any).naturalHeight || displayHeight;
      const baseScale = Math.max(displayWidth / sw, displayHeight / sh);
      const baseW = sw * baseScale;
      const baseH = sh * baseScale;

      const currentCrop = activeCropRef.current;
      const zoom = currentCrop?.zoom ?? 1.0;
      const scaleRatio = displayWidth / 280;
      const panX = (currentCrop?.panX ?? 0) * scaleRatio;
      const panY = (currentCrop?.panY ?? 0) * scaleRatio;

      ctx.save();
      ctx.translate(displayWidth / 2 + panX, displayHeight / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(frame, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      ctx.restore();
    };

    broadcaster.subscribe(onFrame);

    return () => {
      broadcaster.unsubscribe(onFrame);
    };
  }, [src]);

  // Re-render frame when crop settings change
  useEffect(() => {
    if (!src) return;
    const broadcaster = MasterGifBroadcaster.getInstance(src);
    const frame = (broadcaster as any).getCurrentFrame?.();
    if (frame && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.max(1, Math.round(rect.width || canvas.clientWidth || 32));
      const displayHeight = Math.max(1, Math.round(rect.height || canvas.clientHeight || 32));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        const sw = (frame as any).width || (frame as any).naturalWidth || displayWidth;
        const sh = (frame as any).height || (frame as any).naturalHeight || displayHeight;
        const baseScale = Math.max(displayWidth / sw, displayHeight / sh);
        const baseW = sw * baseScale;
        const baseH = sh * baseScale;

        const currentCrop = activeCropRef.current;
        const zoom = currentCrop?.zoom ?? 1.0;
        const scaleRatio = displayWidth / 280;
        const panX = (currentCrop?.panX ?? 0) * scaleRatio;
        const panY = (currentCrop?.panY ?? 0) * scaleRatio;

        ctx.save();
        ctx.translate(displayWidth / 2 + panX, displayHeight / 2 + panY);
        ctx.scale(zoom, zoom);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(frame, -baseW / 2, -baseH / 2, baseW, baseH);
        ctx.restore();

        ctx.restore();
      }
    }
  }, [src, activeCrop]);

  if (!src || loadError) {
    return (
      <div className={fallbackClassName}>
        {fallbackIcon ? fallbackIcon : <span>{fallbackText || "U"}</span>}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={`block object-cover rounded-full pointer-events-none ${className}`}
    />
  );
};
