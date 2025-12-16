/**
 * AWS S3 service mock
 * Owner: Backend Leader
 */

const mockUploadResult = {
  Location: 'https://careerforge-uploads.s3.amazonaws.com/test-file.pdf',
  ETag: '"test-etag"',
  Bucket: 'careerforge-uploads',
  Key: 'resumes/test-file.pdf'
};

const mockS3Service = {
  upload: jest.fn().mockResolvedValue(mockUploadResult),
  deleteObject: jest.fn().mockResolvedValue({}),
  getSignedUrl: jest.fn().mockReturnValue('https://signed-url.com')
};

module.exports = {
  mockUploadResult,
  mockS3Service
};
