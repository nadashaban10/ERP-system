import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyEn(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  locale: string = "en",
  fmt: string = "dd MMM yyyy"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt, { locale: locale === "ar" ? ar : enUS });
}

export function formatDateRelative(
  date: string | Date,
  locale: string = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: locale === "ar" ? ar : enUS,
  });
}

export function getStatusColor(
  status: string
): {
  bg: string;
  text: string;
  border: string;
} {
  const map: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    confirmed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    on_hold: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    inquiry: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    completed: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    new: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
    },
    contacted: {
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    toured: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
    },
    quoted: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    converted: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
  };
  return map[status] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function truncate(str: string, max: number = 40): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function isRTL(locale: string): boolean {
  return locale === "ar";
}
