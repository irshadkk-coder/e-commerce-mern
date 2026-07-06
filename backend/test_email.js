require('dotenv').config();
const { sendVerificationEmail } = require('./utils/emailService');

(async () => {
  console.log('Sending test email to the user configured in SMTP_USER...');
  const result = await sendVerificationEmail(process.env.SMTP_USER, 'test-token-123');
  if (result) {
    console.log('Email sent successfully!');
  } else {
    console.log('Failed to send email.');
  }
})();
