export const truncate = (value: string, max = 48000) => {
  if (value.length <= max) return value;

  const suffix = "\n\n[Truncated for analysis]";
  if (max <= suffix.length) return value.slice(0, max);

  return `${value.slice(0, max - suffix.length)}${suffix}`;
};

export const compactWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
