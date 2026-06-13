import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as EUR currency, e.g. 999 -> "€999" */
export function formatEur(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Slugify a business name for preview URLs, e.g. "Smith Dental Clinic" -> "smith-dental-clinic" */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Format a date as e.g. "Jun 13, 2026, 3:45 PM" */
export function formatDateTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

/** Format a date relative to now, e.g. "2 hours ago" or "in 3 days" */
export function formatRelativeTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const diffSeconds = Math.round((value.getTime() - Date.now()) / 1000);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return "just now";
}
