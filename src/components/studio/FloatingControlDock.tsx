"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CubeIcon,
  BoltIcon,
} from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingControlDockProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onToggle3D: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
}

export function FloatingControlDock({
  isPlaying,
  onTogglePlay,
  onReset,
  currentTime,
  duration,
  onSeek,
  onToggle3D,
  speed,
  onSpeedChange,
  isLooping,
  onToggleLoop,
}: FloatingControlDockProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / (duration || 1)) * 100)
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSeek(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSeek(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const updateSeek = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
      onSeek(percentage * duration);
    },
    [duration, onSeek]
  );

  const formatTime = (time: number) => {
    const secs = Math.floor(time);
    const ms = Math.floor((time % 1) * 10);
    return `${secs}.${ms}s`;
  };

  return (
    <div className="sticky bottom-4 z-30 mx-auto mt-auto w-fit items-center gap-2 rounded-4xl bg-surface-base p-2 border border-border-default select-none shadow-none flex flex-col pointer-events-auto transition-colors duration-200">
      <div className="flex w-full items-center gap-2.5 rounded-full bg-surface-subtle p-1.5 border border-border-default">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold bg-brand-primary text-surface-canvas hover:bg-brand-darker h-9 px-3 w-[88px] active:scale-[0.97] transition-all shrink-0 cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-1.5"
              >
                <PauseIcon className="w-3.5 h-3.5" />
                <span>Pause</span>
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-1.5"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                <span>Play</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Loop Switcher */}
        <button
          type="button"
          onClick={onToggleLoop}
          className={`inline-flex items-center justify-center rounded-full size-9 transition-colors shrink-0 cursor-pointer ${
            isLooping
              ? "bg-brand-primary text-surface-canvas font-bold"
              : "text-brand-secondary hover:bg-surface-subtle hover:text-brand-primary"
          }`}
          title={isLooping ? "Loop Enabled" : "Loop Disabled"}
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLooping ? "text-surface-canvas" : ""}`} />
        </button>

        {/* Interactive Progress Bar */}
        <div
          ref={progressBarRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex w-44 sm:w-64 touch-none items-center justify-center select-none cursor-pointer group py-2"
        >
          <div className="h-3 w-full rounded-full bg-border-default overflow-hidden relative">
            <div
              className="h-full rounded-full bg-brand-primary pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Scrubber Playhead Handle */}
          <div
            className="absolute size-4 rounded-full border-2 border-brand-primary bg-surface-base group-hover:scale-125 pointer-events-none"
            style={{
              left: `calc(${progressPercent}% - 8px)`,
            }}
          />
        </div>

        {/* Timecode */}
        <div className="flex h-4 items-center gap-1 px-1.5 text-xs font-mono font-medium text-brand-secondary shrink-0">
          <span className="text-brand-primary font-semibold">{formatTime(currentTime)}</span>
          <span className="opacity-40">/</span>
          <span className="opacity-70">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Lower Action Controls */}
      <div className="flex items-center gap-1.5 w-full justify-between px-1">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-full text-xs font-medium text-brand-secondary hover:bg-surface-subtle hover:text-brand-primary h-8 gap-1.5 px-3 transition-colors active:scale-[0.97] cursor-pointer"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggle3D}
            className="inline-flex items-center justify-center rounded-full text-xs font-medium text-brand-secondary hover:bg-surface-subtle hover:text-brand-primary size-8 transition-colors active:scale-[0.97] cursor-pointer"
            title="Toggle 3D View"
          >
            <CubeIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (speed === 1) onSpeedChange(1.5);
              else if (speed === 1.5) onSpeedChange(0.5);
              else onSpeedChange(1);
            }}
            className="inline-flex items-center justify-center rounded-full text-xs font-medium bg-surface-subtle text-brand-primary hover:bg-surface-light h-8 gap-1 px-3 border border-border-default transition-colors active:scale-[0.98] cursor-pointer"
            title="Playback Speed"
          >
            <BoltIcon className="w-3.5 h-3.5" />
            <span>{speed}x</span>
          </button>
        </div>
      </div>
    </div>
  );
}
