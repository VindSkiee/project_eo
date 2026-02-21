/**
 * Centralized role label helper.
 * Supports custom labels fetched from the backend.
 *
 * Usage:
 *   import { getRoleLabel, loadCustomRoleLabels } from "@/shared/helpers/roleLabel";
 *
 *   // On app init or dashboard mount:
 *   await loadCustomRoleLabels();
 *
 *   // Then anywhere:
 *   getRoleLabel("LEADER") // → "RW 05" (custom) or "Ketua RW" (default)
 */

import { settingsService } from "@/shared/services/settingsService";

// Default labels (fallback when no custom label is set)
const DEFAULT_LABELS: Record<string, string> = {
  LEADER: "Ketua RW",
  ADMIN: "Ketua RT",
  TREASURER: "Bendahara",
  RESIDENT: "Warga",
  CUSTOM: "Kustom",
};

// In-memory cache of custom labels
let customLabels: Record<string, string> = {};
let isLoaded = false;

/**
 * Load custom role labels from the backend.
 * Call once on dashboard mount. Safe to call multiple times.
 */
export async function loadCustomRoleLabels(): Promise<void> {
  // Tambahkan baris ini agar API tidak ditembak berulang kali
  if (isLoaded) return; 

  try {
    customLabels = await settingsService.getRoleLabelsMap();
    isLoaded = true;
  } catch {
    // Silently fail — will use defaults
    // Do NOT set isLoaded = true here, so the next call can retry
  }
}

/**
 * Force refresh labels (after admin changes them).
 */
export async function refreshRoleLabels(): Promise<void> {
  isLoaded = false;
  await loadCustomRoleLabels();
}

/**
 * Get the display label for a role type.
 * Returns custom label if set, otherwise the default.
 */
export function getRoleLabel(roleType: string | undefined | null): string {
  if (!roleType) return DEFAULT_LABELS.RESIDENT;

  const normalized = roleType.toUpperCase();

  // Custom label takes priority
  if (customLabels[normalized]) {
    return customLabels[normalized];
  }

  return DEFAULT_LABELS[normalized] || roleType;
}

/**
 * Check if custom labels have been loaded.
 */
export function isRoleLabelsLoaded(): boolean {
  return isLoaded;
}
