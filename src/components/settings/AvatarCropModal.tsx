"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";
import { LocalPreferences } from "@/lib/storage/localPreferences";

interface AvatarCropModalProps {
  isOpen: boolean;
  file: File | null;
  initialImageSrc?: string | null;
  onClose: () => void;
  onSave: (
    avatarUrl: string,
    crop?: { zoom: number; panX: number; panY: number }
  ) => void;
}

const CONTAINER_SIZE = 280;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.0;

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  file,
  initialImageSrc,
  onClose,
  onSave,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: CONTAINER_SIZE, height: CONTAINER_SIZE });
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate base dimensions when fitting into container using "cover" mode
  const getBaseDimensions = useCallback(
    (natW: number, natH: number) => {
      const w = natW || CONTAINER_SIZE;
      const h = natH || CONTAINER_SIZE;
      const baseScale = Math.max(CONTAINER_SIZE / w, CONTAINER_SIZE / h);
      return {
        baseW: w * baseScale,
        baseH: h * baseScale,
      };
    },
    []
  );

  // Clamp pan so image never exposes empty borders inside the crop circle
  const clampPan = useCallback(
    (
      currentPan: { x: number; y: number },
      currentZoom: number,
      natW: number,
      natH: number
    ) => {
      const { baseW, baseH } = getBaseDimensions(natW, natH);
      const renderedW = baseW * currentZoom;
      const renderedH = baseH * currentZoom;

      const maxPanX = Math.max(0, (renderedW - CONTAINER_SIZE) / 2);
      const maxPanY = Math.max(0, (renderedH - CONTAINER_SIZE) / 2);

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, currentPan.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, currentPan.y)),
      };
    },
    [getBaseDimensions]
  );

  // Handle zoom changes and clamp pan to new zoom bounds
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number(newZoom.toFixed(2)))
      );
      setZoom(clampedZoom);
      setPan((prevPan) =>
        clampPan(
          prevPan,
          clampedZoom,
          naturalDimensions.width,
          naturalDimensions.height
        )
      );
    },
    [clampPan, naturalDimensions]
  );

  // Load file or existing image into local Data URL & restore crop
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!isMounted) return;
        const src = e.target?.result as string;
        setImageSrc(src);
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    } else if (initialImageSrc) {
      setImageSrc(initialImageSrc);
      const savedCrop = LocalPreferences.get("customAvatarCrop");
      if (savedCrop) {
        setZoom(savedCrop.zoom || 1.0);
        setPan({ x: savedCrop.panX || 0, y: savedCrop.panY || 0 });
      } else {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
      }
    } else {
      setImageSrc(null);
    }

    return () => {
      isMounted = false;
    };
  }, [file, initialImageSrc, isOpen]);

  // Load natural dimensions when image source loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth || CONTAINER_SIZE;
    const natH = img.naturalHeight || CONTAINER_SIZE;
    setNaturalDimensions({ width: natW, height: natH });
  };

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    const clamped = clampPan(
      { x: rawX, y: rawY },
      zoom,
      naturalDimensions.width,
      naturalDimensions.height
    );
    setPan(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag Events (mobile & tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - pan.x,
        y: touch.clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStartRef.current.x;
    const rawY = touch.clientY - dragStartRef.current.y;
    const clamped = clampPan(
      { x: rawX, y: rawY },
      zoom,
      naturalDimensions.width,
      naturalDimensions.height
    );
    setPan(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    handleZoomChange(zoom + delta);
  };

  // Save the exact original image source and applied zoom & pan transform
  const handleSave = () => {
    if (!imageSrc) return;
    onSave(imageSrc, {
      zoom,
      panX: pan.x,
      panY: pan.y,
    });
    onClose();
  };

  const fileFormatBadge = () => {
    if (file) {
      const type = file.type.toLowerCase();
      if (type.includes("gif")) return "GIF";
      if (type.includes("png")) return "PNG";
      if (type.includes("webp")) return "WEBP";
      if (type.includes("jpeg") || type.includes("jpg")) return "JPG";
      return file.name.split(".").pop()?.toUpperCase() || "IMG";
    }
    if (
      imageSrc?.startsWith("data:image/gif") ||
      imageSrc?.toLowerCase().includes(".gif")
    )
      return "GIF";
    if (
      imageSrc?.startsWith("data:image/webp") ||
      imageSrc?.toLowerCase().includes(".webp")
    )
      return "WEBP";
    if (
      imageSrc?.startsWith("data:image/jpeg") ||
      imageSrc?.toLowerCase().includes(".jpg") ||
      imageSrc?.toLowerCase().includes(".jpeg")
    )
      return "JPG";
    return "PNG";
  };

  const { baseW, baseH } = getBaseDimensions(
    naturalDimensions.width,
    naturalDimensions.height
  );

  const renderLivePreview = (size: number) => {
    if (!imageSrc) return null;
    const scaleRatio = size / CONTAINER_SIZE;
    const prevBaseW = baseW * scaleRatio;
    const prevBaseH = baseH * scaleRatio;

    return (
      <div
        className="rounded-full border border-border-default overflow-hidden relative bg-[#0a0a0c] shrink-0 shadow-xs flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        <div
          className="relative pointer-events-none flex items-center justify-center"
          style={{
            width: prevBaseW,
            height: prevBaseH,
            transform: `translate(${pan.x * scaleRatio}px, ${pan.y * scaleRatio}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={imageSrc}
            alt="Preview"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          {/* Backdrop click to dismiss */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-surface-canvas border border-border-default rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-default flex items-center justify-between bg-surface-base">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-brand-primary">Crop Picture</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold">
                  {fileFormatBadge()}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle transition cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center space-y-5 overflow-y-auto custom-scrollbar">
              {/* Interactive Crop Viewport */}
              <div
                className="relative w-[280px] h-[280px] rounded-2xl bg-[#0a0a0c] border border-border-default overflow-hidden cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
              >
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                  }}
                />

                {/* Movable Scalable Image Container */}
                <div
                  className="relative pointer-events-none flex items-center justify-center"
                  style={{
                    width: `${baseW}px`,
                    height: `${baseH}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Crop View"
                    onLoad={handleImageLoad}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Circular Mask & Rule of Thirds Guide Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Round Cutout Ring */}
                  <div className="absolute inset-0 border-2 border-brand-primary/40 rounded-full" />
                  {/* Outer Dim Overlay */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-brand-primary/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
                  {/* Center Crosshair */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white" />
                  </div>
                </div>
              </div>

              {/* Zoom & Adjustment Controls */}
              <div className="w-full max-w-[280px] space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleZoomChange(zoom - 0.1)}
                    disabled={zoom <= MIN_ZOOM}
                    className="p-1.5 rounded-full bg-surface-base hover:bg-surface-subtle disabled:opacity-40 disabled:pointer-events-none border border-border-default text-brand-secondary hover:text-brand-primary transition cursor-pointer active:scale-95"
                    title="Zoom Out"
                  >
                    <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={MIN_ZOOM}
                      max={MAX_ZOOM}
                      step="0.01"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleZoomChange(zoom + 0.1)}
                    disabled={zoom >= MAX_ZOOM}
                    className="p-1.5 rounded-full bg-surface-base hover:bg-surface-subtle disabled:opacity-40 disabled:pointer-events-none border border-border-default text-brand-secondary hover:text-brand-primary transition cursor-pointer active:scale-95"
                    title="Zoom In"
                  >
                    <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 rounded-full bg-surface-base hover:bg-surface-subtle border border-border-default text-brand-secondary hover:text-brand-primary transition cursor-pointer active:scale-95"
                    title="Reset Position"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Preview Badges */}
                <div className="pt-2.5 border-t border-border-default flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {renderLivePreview(38)}
                      <span className="text-[10px] text-brand-muted font-medium">Profile</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderLivePreview(26)}
                      <span className="text-[10px] text-brand-muted font-medium">Sidebar</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-brand-muted">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions: Cancel on Left, Save on Right */}
            <div className="p-3.5 border-t border-border-default bg-surface-base flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-status-danger bg-status-danger-subtle hover:bg-status-danger-light border border-status-danger/20 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-1.5 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
