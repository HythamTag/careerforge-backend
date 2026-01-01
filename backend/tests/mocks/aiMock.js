/**
 * AI service mock
 */

const mockAIResponse = {
  personal: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    location: null,
    linkedin: null,
    github: null,
  },
  summary: 'Experienced software engineer',
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
  },
  certifications: [],
  projects: [],
};

const mockAIService = {
  callAI: jest.fn().mockResolvedValue(JSON.stringify(mockAIResponse)),
  parseJSONResponse: jest.fn().mockReturnValue(mockAIResponse),
};

module.exports = {
  mockAIResponse,
  mockAIService,
};

