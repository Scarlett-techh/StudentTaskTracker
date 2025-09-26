import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';
import { storage } from './storage';

// Configure MailerSend for sending emails
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

const defaultSender = new Sender("no-reply@trial-351ndgwy1lzg7qrx.mlsender.net", "Student Learning Platform");

// Fallback transporter for password reset emails
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email',
    pass: 'password'
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

// Interface for work item details
interface WorkItem {
  id: number;
  title: string;
  type: 'task' | 'note' | 'photo';
  subject?: string;
  preview?: string;
  date: string;
  status?: string;
}

// Send shared work email using MailerSend
export async function sendSharedWorkEmail(
  recipientEmail: string,
  studentName: string,
  message: string,
  workItems: WorkItem[]
): Promise<boolean> {
  try {
    const recipients = [new Recipient(recipientEmail, 'Learning Coach')];
    
    // Create work items list for the email
    const workItemsList = workItems.map(item => {
      const typeEmoji = {
        task: '✅',
        note: '📝',
        photo: '📸'
      }[item.type];
      
      return `
        <li style="margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 18px;">${typeEmoji}</span>
            <strong style="color: #1e293b; font-size: 16px;">${item.title}</strong>
            ${item.status === 'completed' ? '<span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">✓ Completed</span>' : ''}
          </div>
          ${item.subject ? `<div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Subject: ${item.subject}</div>` : ''}
          ${item.preview ? `<div style="color: #64748b; font-size: 14px; line-height: 1.4;">${item.preview.substring(0, 100)}${item.preview.length > 100 ? '...' : ''}</div>` : ''}
          <div style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Date: ${item.date}</div>
        </li>
      `;
    }).join('');
    
    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setSubject(`📚 ${studentName} has shared their work with you`)
      .setHtml(`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">📚 Work Shared!</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${studentName} has shared their learning progress with you</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            ${message ? `
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #6366f1;">
                <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 16px;">💬 Message from ${studentName}:</h3>
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">${message}</p>
              </div>
            ` : ''}
            
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">📋 Shared Work Items (${workItems.length})</h2>
            
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${workItemsList}
            </ul>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-top: 24px; text-align: center;">
              <p style="margin: 0; color: #059669; font-size: 14px; line-height: 1.6;">
                <strong>🎉 Great progress!</strong> ${studentName} is actively engaging with their learning materials and completing their work.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Sent from Student Learning Platform</p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">This email was sent automatically when ${studentName} shared their work.</p>
          </div>
        </div>
      `);
      
    await mailerSend.email.send(emailParams);
    return true;
    
  } catch (error) {
    console.error('Error sending shared work email:', error);
    return false;
  }
}