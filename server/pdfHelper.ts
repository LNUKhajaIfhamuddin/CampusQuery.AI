/**
 * Safe PDF and text extractor
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      // Dynamic import of pdf-parse to handle ESM/CJS compatibility safely
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    } catch (err) {
      console.warn('[PDF] Failed to parse with pdf-parse, attempting stream/plain fallback:', err);
    }

    // Fallback: extract printable strings from PDF stream if simple text
    const rawString = buffer.toString('latin1');
    const matches = rawString.match(/\(([^()]{3,})\)Tj/g);
    if (matches && matches.length > 0) {
      return matches.map((m) => m.slice(1, -3)).join(' ');
    }
  }

  // Fallback to utf-8 text
  return buffer.toString('utf-8');
}
