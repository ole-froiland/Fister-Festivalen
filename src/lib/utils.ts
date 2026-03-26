export function formatFestivalDate(dateString: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatRelativeTime(timestamp: number) {
  const difference = Date.now() - timestamp;

  if (difference < 60_000) {
    return "Nettopp";
  }

  if (difference < 3_600_000) {
    return `${Math.floor(difference / 60_000)} min siden`;
  }

  if (difference < 86_400_000) {
    return `${Math.floor(difference / 3_600_000)} t siden`;
  }

  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

export function slugifyFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function toTitleCase(value: string) {
  return value.length > 0
    ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
    : value;
}
