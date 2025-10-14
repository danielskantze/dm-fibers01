export function generateId(length = 16): string {
  return Array.from({length}).map((_) => (
    Math.floor(Math.random() * 16).toString(16))
  ).join("");
}