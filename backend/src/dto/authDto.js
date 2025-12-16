/**
 * Authentication Data Transfer Objects
 * Owner: Auth Developer
 */

class LoginDto {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  validate() {
    if (!this.email || !this.password) {
      throw new Error('Email and password are required');
    }
    return true;
  }
}

class RegisterDto {
  constructor(email, password, firstName, lastName) {
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  validate() {
    if (!this.email || !this.password || !this.firstName || !this.lastName) {
      throw new Error('All fields are required');
    }
    return true;
  }
}

class AuthResponseDto {
  constructor(user, tokens) {
    this.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified
    };
    this.tokens = tokens;
  }
}

module.exports = {
  LoginDto,
  RegisterDto,
  AuthResponseDto
};
