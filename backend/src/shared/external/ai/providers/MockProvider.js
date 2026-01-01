/**
 * MOCK PROVIDER
 * Simple mock provider for testing
 */
const BaseProvider = require('./BaseProvider');

class MockProvider extends BaseProvider {
  constructor(options = {}) {
    super();
    this.delay = options.delay || 100;
    this.name = 'mock';
  }

  getName() { return this.name; }

  async callAI(messages, options = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.delay));

    // Return mock response based on input
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.includes('Extract CV information')) {
      return JSON.stringify({
        personal: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 234 567 8900',
        },
        experience: [{
          title: 'Software Engineer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: 'present',
          description: 'Developing software applications',
        }],
        education: [{
          degree: 'Bachelor of Computer Science',
          institution: 'University of Technology',
          graduationYear: 2019,
        }],
        skills: {
          technical: ['JavaScript', 'Python', 'React'],
          languages: ['English'],
        },
      });
    }

    return 'Mock AI response for testing purposes';
  }
}

module.exports = MockProvider;

