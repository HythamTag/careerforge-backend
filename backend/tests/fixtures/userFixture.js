/**
 * User test fixtures
 * Owner: Auth Developer
 */

const testUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3lTf8QXqO', // 'password123'
  firstName: 'John',
  lastName: 'Doe',
  isVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const userRegistrationData = {
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  firstName: 'Jane',
  lastName: 'Smith'
};

const invalidUserData = {
  email: 'invalid-email',
  password: '123',
  firstName: '',
  lastName: ''
};

module.exports = {
  testUser,
  userRegistrationData,
  invalidUserData
};
