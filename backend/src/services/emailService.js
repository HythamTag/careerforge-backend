/**
 * Email service
 * Owner: Auth Developer
 */

class EmailService {
  static async sendVerificationEmail(email, token) {
    // TODO: Send verification email
    console.log(`Sending verification email to ${email}`);
  }

  static async sendPasswordResetEmail(email, token) {
    // TODO: Send password reset email
    console.log(`Sending password reset email to ${email}`);
  }
}

module.exports = EmailService;
