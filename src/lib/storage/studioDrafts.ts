/**
 * Studio Drafts Storage Layer
 * 
 * Preserves the active Studio Canvas configuration locally in IndexedDB/localStorage.
 * Moving sliders, swapping colors, and tweaking templates are kept in local drafts
 * and only persisted to PostgreSQL when the user explicitly clicks "Save" or "Export".
 */

import { IndexedDBCache } from "./indexedDbCache";
import { StudioCanvasState } from "@/components/studio/CanvasStage";

const DRAFT_PREFIX = "draft_studio_";
const RECENT_DRAFT_KEY = `${DRAFT_PREFIX}latest`;

export const StudioDrafts = {
  async saveDraft(state: StudioCanvasState, draftId = "latest"): Promise<void> {
    const key = `${DRAFT_PREFIX}${draftId}`;
    // Studio drafts have a 30-day client TTL
    const TTL_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    await IndexedDBCache.set(key, state, TTL_30_DAYS);
    if (draftId !== "latest") {
      await IndexedDBCache.set(RECENT_DRAFT_KEY, state, TTL_30_DAYS);
    }
  },

  async loadDraft(draftId = "latest"): Promise<StudioCanvasState | null> {
    const key = `${DRAFT_PREFIX}${draftId}`;
    return await IndexedDBCache.get<StudioCanvasState>(key);
  },

  async clearDraft(draftId = "latest"): Promise<void> {
    const key = `${DRAFT_PREFIX}${draftId}`;
    await IndexedDBCache.delete(key);
  },
};
