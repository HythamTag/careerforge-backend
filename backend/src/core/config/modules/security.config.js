/**
 * SECURITY CONFIGURATION
 *
 * CORS, JWT, and security headers configuration.
 */

class SecurityConfig {
  static getConfig(env) {
    return {
      cors: {
        allowedOrigins: env.CORS_ALLOWED_ORIGINS,
        credentials: true,
        optionsSuccessStatus: 200,
      },
      jwt: {
        secret: env.JWT_SECRET,
        accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
      },
      headers: {
        contentSecurityPolicy: 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; connect-src \'self\' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com;',
        strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
    };
  }
}

module.exports = SecurityConfig;
