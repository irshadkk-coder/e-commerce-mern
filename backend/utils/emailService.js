const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Log the configured sender email on startup (without exposing passwords)
logger.info(`Email Service Configured. Emails will be sent from: ${process.env.SMTP_FROM || 'NOT_CONFIGURED'}`);

const sendVerificationEmail = async (email, otp) => {

  const mailOptions = {
    from: `"NeoShop" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Your NeoShop Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: #000000; padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
          .content { padding: 40px 30px; text-align: center; color: #333333; }
          .content h2 { margin-top: 0; color: #111111; font-size: 22px; }
          .content p { font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px; }
          .otp { display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #000000; background-color: #f4f7f6; border-radius: 8px; margin: 20px 0; }
          .warning { font-size: 14px; color: #d32f2f; margin-top: 20px; font-weight: 500; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #888888; border-top: 1px solid #eeeeee; }
          .footer a { color: #000000; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEOSHOP</h1>
          </div>
          <div class="content">
            <h2>Welcome to NeoShop!</h2>
            <p>Thank you for joining us. We're thrilled to have you on board. Please use the verification code below to activate your account and start exploring premium tech.</p>
            <div class="otp">${otp}</div>
            <p style="margin-top: 10px; font-size: 15px; color: #777;">This code is valid for <strong>10 minutes</strong>.</p>
            <p class="warning">Security Notice: Please do not share this code with anyone. NeoShop employees will never ask for your verification code.</p>
          </div>
          <div class="footer">
            <p>Need help? Contact our <a href="mailto:support@neoshop.com">support team</a>.</p>
            <p>&copy; ${new Date().getFullYear()} NeoShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"NeoShop Support" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: #000000; padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
          .content { padding: 40px 30px; text-align: center; color: #333333; }
          .content p { font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px; }
          .btn { display: inline-block; padding: 14px 30px; color: #ffffff; background-color: #000000; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #888888; border-top: 1px solid #eeeeee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEOSHOP</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password. Click the button below to choose a new one:</p>
            <a href="${resetUrl}" class="btn">Reset Password</a>
            <p style="margin-top: 30px; font-size: 14px; color: #777;">If you didn't request this, you can safely ignore this email.<br>This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} NeoShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
