import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';
import { storage } from './storage';

// Create a test transporter using ethereal.email for development
// In production, you would use a real email service like SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email', // Replace with actual test credentials
    pass: 'password'                       // Replace with actual test credentials
  }
});

// Generate a secure random token
export function generateToken(): string {
  return cryptoRandomString({ length: 32, type: 'url-safe' });
}

// Set a password reset token for a user
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
  
  await storage.updateUser(user.id, {
    resetToken,
    resetTokenExpiry
  });
  
  return resetToken;
}

// Send a password reset email
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: 'no-reply@student-task-tracker.com',
      to: email,
      subject: 'Reset Your Password - Student Task Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" 
               style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
               Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The Student Task Tracker Team</p>
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <img src="https://aliud-alternative.com/logo.png" alt="Aliud Alternative Logo" width="120" />
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Verify a password reset token
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  const user = await storage.getUserByResetToken(token);
  
  if (!user || !user.resetTokenExpiry) {
    return null;
  }
  
  // Check if token is expired
  if (new Date() > new Date(user.resetTokenExpiry)) {
    return null;
  }
  
  return user.id;
}