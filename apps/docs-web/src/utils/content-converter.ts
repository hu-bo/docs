/**
 * Content format converter utilities
 * Converts between different content formats (HTML, Markdown, Plain text)
 */

/**
 * Strip HTML tags and return plain text
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Create a temporary element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Get text content
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Extract preview text from HTML content
 */
export function getContentPreview(html: string, maxLength: number = 200): string {
  const plainText = htmlToPlainText(html);
  return truncateText(plainText, maxLength);
}

/**
 * Simple Markdown to HTML converter (basic)
 * For a full implementation, consider using a library like marked or markdown-it
 */
export function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n/gim, '<br>');

  return html;
}

/**
 * Sanitize HTML to prevent XSS
 * For production, consider using DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Basic sanitization - remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s*on\w+='[^']*'/gi, '');

  return sanitized;
}

/**
 * Check if content is empty (only whitespace or empty tags)
 */
export function isContentEmpty(html: string): boolean {
  if (!html) return true;

  const plainText = htmlToPlainText(html);
  return plainText.trim().length === 0;
}

/**
 * Count words in content
 */
export function countWords(html: string): number {
  const plainText = htmlToPlainText(html);
  if (!plainText.trim()) return 0;

  // Split by whitespace and filter empty strings
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Count characters in content (excluding HTML tags)
 */
export function countCharacters(html: string): number {
  const plainText = htmlToPlainText(html);
  return plainText.length;
}

/**
 * Estimate reading time in minutes
 * Assumes average reading speed of 200 words per minute for Chinese
 * and 250 words per minute for English
 */
export function estimateReadingTime(html: string): number {
  const plainText = htmlToPlainText(html);
  if (!plainText.trim()) return 0;

  // Count Chinese characters
  const chineseChars = (plainText.match(/[\u4e00-\u9fff]/g) || []).length;

  // Count English words (non-Chinese text)
  const englishText = plainText.replace(/[\u4e00-\u9fff]/g, ' ');
  const englishWords = englishText.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Calculate reading time
  const chineseReadingTime = chineseChars / 200;
  const englishReadingTime = englishWords / 250;

  return Math.ceil(chineseReadingTime + englishReadingTime);
}
