import { config } from "../config.js";

export function isAdmin(userId: number | undefined): boolean {
  if (userId === undefined) return false;
  return config.adminChatIds.includes(userId);
}
