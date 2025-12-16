/**
 * PDF parser service
 * Owner: Resume Developer
 */

const pdfParse = require('pdf-parse');

class PDFParserService {
  static async extractText(fileBuffer) {
    try {
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      throw new Error('Failed to parse PDF: ' + error.message);
    }
  }
}

module.exports = PDFParserService;
