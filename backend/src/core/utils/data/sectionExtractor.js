/**
 * Simple section extractor to isolate parts of the CV text.
 * Helps reduce hallucination by feeding only relevant text to the AI.
 */

function extractSection(text, titles) {
  if (!text) {return '';}

  const lower = text.toLowerCase();
  let start = -1;
  let end = text.length;

  // Find the start of the section
  for (const t of titles) {
    // Look for title followed by newline or colon
    // This regex matches the title at the start of a line, allowing for some whitespace/symbols
    const regex = new RegExp(`(?:^|\\n)\\s*${t.toLowerCase()}\\s*(?:[:\\n]|$)`, 'i');
    const match = text.match(regex);

    if (match) {
      start = match.index + match[0].length;
      break;
    }
  }

  if (start === -1) {return '';}

  // Find the next section header to define the end
  // Look for uppercase words on a new line that look like headers
  // 3 or more uppercase letters, allowing spaces
  const after = text.slice(start);
  const nextHeaderMatch = after.match(/\n\s*[A-Z][A-Z\s&-]{3,}\s*(?:\n|:|$)/);

  if (nextHeaderMatch) {
    end = start + nextHeaderMatch.index;
  }

  return text.slice(start, end).trim();
}

module.exports = extractSection;

