export function readingTimeMinutes(text: string, wordsPerMinute = 200): number {
  const words = text
    .replace(/[#*_`>~\[\]()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}
