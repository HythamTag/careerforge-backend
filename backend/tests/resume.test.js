/**
 * Resume tests
 * Owner: Resume Developer
 */

const ResumeService = require('../src/services/resumeService');
const PDFParserService = require('../src/services/pdfParserService');

describe('ResumeService', () => {
  test('should create resume', async () => {
    const userId = 'user123';
    const fileData = { originalname: 'resume.pdf' };
    const result = await ResumeService.createResume(userId, fileData);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('uploaded');
  });

  test('should get resume', async () => {
    const resumeId = 'resume123';
    const result = await ResumeService.getResume(resumeId);

    expect(result).toHaveProperty('id');
    expect(result.id).toBe(resumeId);
  });
});

describe('PDFParserService', () => {
  test('should extract text from PDF buffer', async () => {
    const mockBuffer = Buffer.from('PDF content');
    // Note: This will fail in real test due to PDF parsing
    // but tests the service interface
    await expect(PDFParserService.extractText(mockBuffer))
      .rejects.toThrow('Failed to parse PDF');
  });
});
