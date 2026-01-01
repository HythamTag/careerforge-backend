/**
 * ERRORS MODULE
 *
 * Centralized error handling exports.
 * Combines error codes, classes, and factory in one import.
 *
 * @module errors
 */

// Import ERROR_CODES from constants (single source of truth)
const { ERROR_CODES } = require('@constants');

// Base
const AppError = require('./base/AppError');
const ErrorFactory = require('./base/ErrorFactory');

// Domain Errors
const ValidationError = require('./domain/ValidationError');
const NotFoundError = require('./domain/NotFoundError');
const JobError = require('./domain/JobError');
const CVError = require('./domain/CVError');
const AuthError = require('./domain/AuthError');
const UserError = require('./domain/UserError');
const WebhookError = require('./domain/WebhookError');

// External Errors
const AIError = require('./external/AIError');
const AIQuotaExceededError = require('./external/AIQuotaExceededError');
const AIInvalidResponseError = require('./external/AIInvalidResponseError');
const AITimeoutError = require('./external/AITimeoutError');
const StorageError = require('./external/StorageError');
const FileError = require('./external/FileError');

// HTTP Errors
const ForbiddenError = require('./http/ForbiddenError');

module.exports = {
  // Error codes
  ERROR_CODES,

  // Base & Factory
  AppError,
  ErrorFactory,

  // Domain Errors
  ValidationError,
  NotFoundError,
  JobError,
  CVError,
  AuthError,
  UserError,
  WebhookError,

  // External Errors
  AIError,
  AIQuotaExceededError,
  AIInvalidResponseError,
  AITimeoutError,
  StorageError,
  FileError,

  // HTTP Errors
  ForbiddenError,
};
