/**
 * Helper to build the full URL for a user's avatar/profile image.
 *
 * Usage:
 *   import { getAvatarUrl } from "@/shared/helpers/avatarUrl";
 *   const url = getAvatarUrl(user.profileImage); // string | null
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Build a full avatar URL from a relative profileImage path.
 * Returns null if no image is set.
 */
export function getAvatarUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null;
  // Already absolute URL
  if (profileImage.startsWith("http")) return profileImage;
  return `${API_BASE}${profileImage}`;
}
