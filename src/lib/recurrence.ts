/**
 * Pure recurrence library — geen React, geen DB.
 * Eén bron van waarheid voor:
 *  - generateDates: berekenen van occurrence-datums
 *  - summarizeRecurrence: menselijke samenvatting (NL)
 *  - mergeOccurrences: niet-destructief mergen met bestaande occurrences
 */

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "custom";
export type RecurrenceCustomFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceEndType = "never" | "date" | "count";

export interface RecurrenceInput {
  startDate: string;            // ISO date "YYYY-MM-DD"
  isRecurring: boolean;
  recurringFreq: string;        // "daily" | "weekly" | "monthly" | "custom"
  recurringCustomFreq?: string; // "daily" | "weekly" | "monthly"
  recurringInterval?: number;   // 1, 2, ...
  recurringDays?: number[];     // 1=Mon ... 7=Sun
  recurringEndType?: string;    // "never" | "date" | "count"
  recurringEndDate?: string;    // ISO date
  recurringEndCount?: number;   // X keer
}

export interface ExistingOccurrence {
  id: string;
  occurrence_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  label: string | null;
  overrides: Record<string, unknown>;
}

export interface MergeResult {
  toInsert: Array<{ occurrence_date: string }>;
  toDelete: string[]; // ids of occurrences whose date no longer exists AND that have no manual edits
  toKeep: ExistingOccurrence[];
  preserved: number;
}

const HARD_LIMIT = 200; // safety cap

/* ─────────────────────────────────────────────
 *  generateDates
 * ───────────────────────────────────────────── */
export function generateDates(input: RecurrenceInput): string[] {
  if (!input.startDate || !input.isRecurring) return [];

  const start = parseISODate(input.startDate);
  if (!start) return [];

  const freq: string =
    input.recurringFreq === "custom"
      ? (input.recurringCustomFreq || "weekly")
      : input.recurringFreq;

  const interval = Math.max(1, input.recurringInterval || 1);
  const endType = input.recurringEndType || "never";
  const endDate = endType === "date" && input.recurringEndDate
    ? parseISODate(input.recurringEndDate)
    : null;
  const maxCount = endType === "count"
    ? Math.max(1, Math.min(input.recurringEndCount || 10, HARD_LIMIT))
    : HARD_LIMIT;

  // Default horizon for "never" = 1 year from start
  const horizonEnd = endDate ?? addDays(start, 365);

  const dates: string[] = [];

  if (freq === "daily") {
    let cur = new Date(start);
    while (cur <= horizonEnd && dates.length < maxCount) {
      dates.push(formatISODate(cur));
      cur = addDays(cur, interval);
    }
  } else if (freq === "weekly") {
    const days = (input.recurringDays && input.recurringDays.length > 0)
      ? [...input.recurringDays].sort((a, b) => a - b)
      : [isoDayOfWeek(start)]; // default: same weekday as start

    // Walk week-by-week (interval = weeks gap)
    let weekStart = startOfIsoWeek(start);
    let safety = 0;
    while (weekStart <= horizonEnd && dates.length < maxCount && safety < 520) {
      for (const d of days) {
        const occ = addDays(weekStart, d - 1); // Mon=1 → +0
        if (occ < start) continue;
        if (occ > horizonEnd) break;
        dates.push(formatISODate(occ));
        if (dates.length >= maxCount) break;
      }
      weekStart = addDays(weekStart, 7 * interval);
      safety++;
    }
  } else if (freq === "monthly") {
    let cur = new Date(start);
    while (cur <= horizonEnd && dates.length < maxCount) {
      dates.push(formatISODate(cur));
      cur = addMonths(cur, interval);
    }
  }

  // Dedupe + sort (defensive)
  const unique = Array.from(new Set(dates)).sort();
  return unique.slice(0, maxCount);
}

/* ─────────────────────────────────────────────
 *  summarizeRecurrence — menselijke NL samenvatting
 * ───────────────────────────────────────────── */
const DAY_NAMES_FULL = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const DAY_NAMES_SHORT = ["ma", "di", "wo", "do", "vr", "za", "zo"];

export function summarizeRecurrence(input: RecurrenceInput): string {
  if (!input.isRecurring) return "";

  const freq: string =
    input.recurringFreq === "custom"
      ? (input.recurringCustomFreq || "weekly")
      : input.recurringFreq;
  const interval = Math.max(1, input.recurringInterval || 1);

  let base = "";
  if (freq === "daily") {
    base = interval === 1 ? "Dagelijks" : `Elke ${interval} dagen`;
  } else if (freq === "weekly") {
    const days = input.recurringDays && input.recurringDays.length > 0
      ? input.recurringDays
      : (input.startDate ? [isoDayOfWeek(parseISODate(input.startDate)!)] : []);
    const dayLabel = formatDays(days);
    if (interval === 1) {
      base = `Elke ${dayLabel}`;
    } else if (interval === 2) {
      base = `Om de week op ${dayLabel}`;
    } else {
      base = `Elke ${interval} weken op ${dayLabel}`;
    }
  } else if (freq === "monthly") {
    base = interval === 1 ? "Maandelijks" : `Elke ${interval} maanden`;
  } else {
    return "";
  }

  // End suffix
  const endType = input.recurringEndType || "never";
  let suffix = "";
  if (endType === "date" && input.recurringEndDate) {
    const d = parseISODate(input.recurringEndDate);
    if (d) suffix = ` tot ${formatHumanDate(d)}`;
  } else if (endType === "count" && input.recurringEndCount && input.recurringEndCount > 0) {
    suffix = `, stopt na ${input.recurringEndCount} keer`;
  }

  // Start suffix (only if no explicit end-date and we have a startDate)
  let startSuffix = "";
  if (input.startDate && endType !== "date") {
    const d = parseISODate(input.startDate);
    if (d) startSuffix = ` vanaf ${formatHumanDate(d)}`;
  }

  return `${base}${startSuffix}${suffix}`.trim();
}

function formatDays(days: number[]): string {
  if (!days || days.length === 0) return "dag";
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return "dag";
  if (sorted.length === 1) return DAY_NAMES_FULL[sorted[0] - 1];
  if (sorted.length === 2) {
    return `${DAY_NAMES_FULL[sorted[0] - 1]} en ${DAY_NAMES_FULL[sorted[1] - 1]}`;
  }
  // 3+ → use short names with comma
  const short = sorted.map(d => DAY_NAMES_SHORT[d - 1]);
  return short.slice(0, -1).join(", ") + " en " + short[short.length - 1];
}

/* ─────────────────────────────────────────────
 *  mergeOccurrences — niet-destructieve merge
 * ───────────────────────────────────────────── */
/**
 * Berekent welke occurrences nieuw moeten worden toegevoegd, welke verwijderd kunnen worden,
 * en welke behouden blijven. Behoudt:
 *  - alle occurrences met manual status (hidden/cancelled)
 *  - alle occurrences met label, overrides of niet-default tijd (start_time/end_time)
 *  - alle occurrences in het verleden
 */
export function mergeOccurrences(
  newDates: string[],
  existing: ExistingOccurrence[],
  defaultStartTime: string | null = null,
  defaultEndTime: string | null = null
): MergeResult {
  const newSet = new Set(newDates);
  const existingByDate = new Map(existing.map(o => [o.occurrence_date, o]));
  const today = formatISODate(new Date());

  const toInsert: Array<{ occurrence_date: string }> = [];
  const toDelete: string[] = [];
  const toKeep: ExistingOccurrence[] = [];
  let preserved = 0;

  // 1. Nieuwe datums die nog niet bestaan → insert
  for (const d of newDates) {
    if (!existingByDate.has(d)) {
      toInsert.push({ occurrence_date: d });
    } else {
      toKeep.push(existingByDate.get(d)!);
    }
  }

  // 2. Bestaande datums niet meer in newSet
  for (const occ of existing) {
    if (newSet.has(occ.occurrence_date)) continue;

    const isPast = occ.occurrence_date < today;
    const hasManualEdit =
      occ.status !== "active" ||
      !!occ.label ||
      (occ.overrides && Object.keys(occ.overrides).length > 0) ||
      (occ.start_time !== null && occ.start_time !== defaultStartTime) ||
      (occ.end_time !== null && occ.end_time !== defaultEndTime);

    if (isPast || hasManualEdit) {
      toKeep.push(occ);
      preserved++;
    } else {
      toDelete.push(occ.id);
    }
  }

  return { toInsert, toDelete, toKeep, preserved };
}

/* ─────────────────────────────────────────────
 *  helpers
 * ───────────────────────────────────────────── */
function parseISODate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatISODate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

/** ISO day-of-week: 1=Mon ... 7=Sun */
function isoDayOfWeek(d: Date): number {
  const js = d.getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

/** Returns Monday of the ISO-week containing d */
function startOfIsoWeek(d: Date): Date {
  const dow = isoDayOfWeek(d);
  return addDays(d, -(dow - 1));
}

function formatHumanDate(d: Date): string {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}
