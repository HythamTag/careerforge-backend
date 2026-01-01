/**
 * Mock AWS S3 Request Presigner
 */
module.exports = {
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-signed-url.com'),
};

