/**
 * Normalizes class name strings to a consistent format: "Class X"
 * Examples:
 *   "class 10" -> "Class 10"
 *   "Class 10th" -> "Class 10"
 *   "10" -> "Class 10"
 *   "class-10" -> "Class 10"
 *   "CLASS 12TH" -> "Class 12"
 */
export function normalizeClassName(input: string): string {
  if (!input || typeof input !== 'string') return input;
  
  // Remove common suffixes and clean up
  let cleaned = input.trim()
    .replace(/[\-_]/g, ' ')           // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ')             // Collapse multiple spaces
    .replace(/th$/i, '')              // Remove trailing 'th'
    .replace(/st$/i, '')              // Remove trailing 'st'
    .replace(/nd$/i, '')              // Remove trailing 'nd'
    .replace(/rd$/i, '')              // Remove trailing 'rd'
    .trim();
  
  // Extract the number
  const match = cleaned.match(/(\d+)/);
  if (!match) return input; // If no number found, return as-is
  
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 12) return input; // Only normalize valid class numbers
  
  return `Class ${num}`;
}
