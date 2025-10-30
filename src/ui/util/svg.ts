export function svgToUrl(svgString: string): string {
  // 1. Optimize/clean the SVG string
  // Remove newlines and tabs
  const cleanedString = svgString
    .replace(/(\r\n|\n|\r)/gm, "") // Remove newlines
    .replace(/\t/g, " "); // Replace tabs with spaces

  // 2. URL-encode special characters
  // We need to encode characters that have special meaning in a URL.
  // We don't use encodeURIComponent() here because it's too aggressive
  // for this use case and encodes things like ':' and '/' which are fine.
  const encodedString = cleanedString
    .replace(/"/g, "'") // Use single quotes for attributes
    .replace(/%/g, "%25") // Percent
    .replace(/#/g, "%23") // Hash
    .replace(/{/g, "%7B") // Left Brace
    .replace(/}/g, "%7D") // Right Brace
    .replace(/</g, "%3C") // Less Than
    .replace(/>/g, "%3E"); // Greater Than
  // Note: '&' is technically a reserved character, but it's
  // often not necessary to encode it for modern browsers
  // unless it's part of a query string. Add .replace(/&/g, "%26")
  // if you encounter issues.

  // 3. Create the Data URI and wrap in 'url()'
  return `url("data:image/svg+xml,${encodedString}")`;
}
