/**
 * Simple custom event helpers for cross-component communication.
 * Used to notify the sidebar (DashboardLayout) about changes
 * without requiring a full page refresh.
 *
 * Usage:
 *   import { emitSidebarUpdate, onSidebarUpdate, offSidebarUpdate } from "@/shared/helpers/sidebarEvents";
 *
 *   // Emit after avatar upload or role label change:
 *   emitSidebarUpdate();
 *
 *   // Listen in DashboardLayout:
 *   useEffect(() => {
 *     onSidebarUpdate(handler);
 *     return () => offSidebarUpdate(handler);
 *   }, []);
 */

const EVENT_NAME = "sidebar:update";

/** Dispatch a sidebar update event. */
export function emitSidebarUpdate(): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/** Subscribe to sidebar update events. */
export function onSidebarUpdate(handler: () => void): void {
  window.addEventListener(EVENT_NAME, handler);
}

/** Unsubscribe from sidebar update events. */
export function offSidebarUpdate(handler: () => void): void {
  window.removeEventListener(EVENT_NAME, handler);
}
