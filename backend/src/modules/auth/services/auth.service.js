/**
 * AUTH SERVICE
 *
 * Authentication service for user registration, login, and token management.
 *
 * @module modules/auth/auth.service
 */

// ==========================================
// EXTERNAL DEPENDENCIES
// ==========================================
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==========================================
// CORE MODULES
// ==========================================
const { ERROR_CODES, HTTP_STATUS, TIME_CONSTANTS, USER_STATUS } = require('@constants');
const { ValidationError, NotFoundError, AppError, AuthError, UserError, ErrorFactory } = require('@errors');

class AuthService {
  /**
     * @param {UserRepository} userRepository
     * @param {Object} config
     */
  constructor(userRepository, config) {
    this.userRepository = userRepository;
    this.config = config;
  }

  /**
     * Register new user
     */
  async register(data) {

    // Validate required fields
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw ErrorFactory.validationFailed('Email, password, firstName, and lastName are required', ERROR_CODES.AUTH_MISSING_REQUIRED_FIELDS);
    }

    // Check if user already exists (any status, not just active)
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw ErrorFactory.validationFailed('User with this email already exists', ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS);
    }

    // Check if email verification is required
    const requiresVerification = this.config.security?.emailVerificationRequired === true;

    // Generate unique referral code to avoid MongoDB unique index conflict
    const refCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Build user data
    const userData = {
      email: data.email,
      password: data.password, // Will be hashed by pre-save hook
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      referral: {
        refCode,
      },
    };

    // If verification required, add token and set status to pending
    if (requiresVerification) {
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      userData.emailVerificationToken = emailVerificationToken;
      userData.emailVerificationExpires = new Date(Date.now() + TIME_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MS);
      userData.status = USER_STATUS.PENDING_VERIFICATION;
      userData.emailVerified = false;
    } else {
      // No verification needed - activate immediately
      userData.status = USER_STATUS.ACTIVE;
      userData.emailVerified = true;
    }

    const user = await this.userRepository.create(userData);

    // If verification not required, return token immediately (auto-login)
    if (!requiresVerification) {
      const token = this._generateToken(user);
      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
        },
      };
    }

    // Verification required - return without token
    // await this.sendVerificationEmail(user.email, emailVerificationToken);
    return {
      userId: user._id,
      email: user.email,
      requiresEmailVerification: true,
    };
  }

  /**
     * Login user
     */
  async login(email, password) {

    // Find user by email
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new AuthError('Invalid email or password', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    // Check if user is active or pending verification (suspended/inactive should not login)
    if (user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.INACTIVE) {
      throw new AuthError('Account is not active', ERROR_CODES.AUTH_ACCOUNT_INACTIVE);
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new AuthError('Invalid email or password', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login
    await this.userRepository.updateLastActivity(user._id);

    return {
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  }

  /**
     * Generate access token
     */
  generateAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.config.security.jwt.secret;
    if (!jwtSecret) {
      throw new AppError('Server configuration error: Missing JWT secret', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONFIGURATION_ERROR);
    }

    return jwt.sign(payload, jwtSecret, {
      expiresIn: this.config.security.jwt.accessTokenExpiry,
      issuer: 'cv-enhancer',
      audience: 'api-users',
    });
  }

  /**
     * Generate refresh token
     */
  generateRefreshToken(user) {
    const payload = {
      id: user._id.toString(),
      type: 'refresh',
    };

    const jwtSecret = this.config.security.jwt.secret;
    if (!jwtSecret) {
      throw new AppError('Server configuration error: Missing JWT secret', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONFIGURATION_ERROR);
    }

    return jwt.sign(payload, jwtSecret, { // Use same secret for simplicity in this setup, or dedicated refresh secret if available
      expiresIn: this.config.security.jwt.refreshTokenExpiry,
      issuer: 'cv-enhancer',
      audience: 'api-refresh',
    });
  }

  /**
     * Refresh access token
     */
  async refresh(refreshToken) {

    try {
      // Verify refresh token
      const jwtSecret = this.config.security.jwt.secret;
      if (!jwtSecret) {
        throw new AppError('Server configuration error: Missing JWT secret', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONFIGURATION_ERROR);
      }

      const decoded = jwt.verify(
        refreshToken,
        jwtSecret,
        { audience: 'api-refresh' },
      );

      if (decoded.type !== 'refresh') {
        throw new AuthError('Invalid refresh token', ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID);
      }

      // Find user
      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.status !== USER_STATUS.ACTIVE) {
        throw new AuthError('User not found or inactive', ERROR_CODES.AUTH_ACCOUNT_INACTIVE);
      }

      // Generate new tokens
      const token = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AuthError('Invalid or expired refresh token', ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED);
    }
  }

  /**
     * Logout user
     */
  async logout(userId) {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. Server-side we might want to implement
    // token blacklisting for enhanced security.

    // For now, just return success
    return null;
  }

  /**
     * Request password reset
     */
  async forgotPassword(email) {

    // Find user by email
    const user = await this.userRepository.findActiveByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + TIME_CONSTANTS.PASSWORD_RESET_EXPIRY_MS);

    // Save reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // await this.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }

  /**
     * Reset password with token
     */
  async resetPassword(token, newPassword) {

    // Find user with valid reset token
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new AuthError('Invalid or expired reset token', ERROR_CODES.AUTH_RESET_TOKEN_INVALID);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return {
      message: 'Password reset successfully',
    };
  }

  /**
     * Verify email address
     */
  async verifyEmail(token) {

    // Find user with verification token
    const user = await this.userRepository.findByEmailVerificationToken(token);

    if (!user) {
      throw new AuthError('Invalid or expired verification token', ERROR_CODES.AUTH_VERIFICATION_TOKEN_INVALID);
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
      message: 'Email verified successfully',
    };
  }

  /**
     * Resend verification email
     */
  async resendVerification(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    if (user.emailVerified) {
      throw ErrorFactory.validationFailed('Email is already verified', ERROR_CODES.AUTH_EMAIL_ALREADY_VERIFIED);
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + TIME_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MS);
    await user.save();
    // await this.sendVerificationEmail(user.email, emailVerificationToken);

    return {
      message: 'Verification email sent successfully',
    };
  }

  /**
     * Get authenticated user information
     */
  async getMe(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastActivityAt: user.lastActivityAt,
    };
  }
}

module.exports = AuthService;
