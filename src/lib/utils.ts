import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Postgres `time` value (e.g. "20:00:00" or "20:00") or a Date
 * to a compact HH:mm string. Returns an empty string for nullish input.
 */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  }
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
