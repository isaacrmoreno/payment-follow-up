export function formatLabel(value: string | null | undefined) {
  return (value ?? "unknown").replaceAll("_", " ");
}

export function titleCaseWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
