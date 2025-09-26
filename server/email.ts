import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import { storage } from "./storage";

// Check if MailerSend API key is available
const isMailerSendEnabled =
  process.env.MAILERSEND_API_KEY && process.env.MAILERSEND_API_KEY.length > 0;

// Configure MailerSend for sending emails (only if API key is available)
const mailerSend = isMailerSendEnabled
  ? new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || "",
    })
  : null;

const defaultSender = new Sender(
  "no-reply@trial-351ndgwy1lzg7qrx.mlsender.net",
  "Student Learning Platform",
);

// Fallback transporter for when MailerSend is not available
const createTransporter = () => {
  // Use Ethereal email for development if no MailerSend
  if (!isMailerSendEnabled) {
    console.log(
      "📧 Using Ethereal email for development (no MailerSend API key found)",
    );
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || "ethereal.user@ethereal.email",
        pass: process.env.ETHEREAL_PASS || "password",
      },
    });
  }

  // For production with SMTP fallback (if configured)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
};

const transporter = createTransporter();

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate a secure random token
export function generateToken(): string {
  return cryptoRandomString({ length: 32, type: "url-safe" });
}

// Set a password reset token for a user
export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }

  const user = await storage.getUserByEmail(email);

  if (!user) {
    return null;
  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  await storage.updateUser(user.id, {
    resetToken,
    resetTokenExpiry,
  });

  return resetToken;
}

// Send a password reset email with fallback options
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<boolean> {
  try {
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || "no-reply@student-learning-platform.com",
      to: email,
      subject: "Reset Your Password - Student Learning Platform",
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
          <p>Best regards,<br>The Student Learning Platform Team</p>
        </div>
      `,
    };

    // Try MailerSend first if available
    if (isMailerSendEnabled && mailerSend) {
      try {
        const recipients = [new Recipient(email, "User")];
        const sender = new Sender(
          process.env.FROM_EMAIL ||
            "no-reply@trial-351ndgwy1lzg7qrx.mlsender.net",
          "Student Learning Platform",
        );

        const emailParams = new EmailParams()
          .setFrom(sender)
          .setTo(recipients)
          .setSubject("Reset Your Password - Student Learning Platform")
          .setHtml(mailOptions.html);

        await mailerSend.email.send(emailParams);
        console.log("✅ Password reset email sent via MailerSend");
        return true;
      } catch (mailerSendError) {
        console.warn(
          "⚠️ MailerSend failed, falling back to SMTP:",
          mailerSendError,
        );
      }
    }

    // Fallback to SMTP/transporter
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent via SMTP:", info.messageId);

      // If using Ethereal, log the preview URL
      if (process.env.NODE_ENV === "development" && info.messageId) {
        console.log("📧 Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
      return true;
    }

    throw new Error("No email transport available");
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
}

// Verify a password reset token
export async function verifyPasswordResetToken(
  token: string,
): Promise<number | null> {
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
  type: "task" | "note" | "photo";
  subject?: string;
  preview?: string;
  date: string;
  status?: string;
}

// Send shared work email with fallback options
export async function sendSharedWorkEmail(
  recipientEmail: string,
  studentName: string,
  message: string,
  workItems: WorkItem[],
): Promise<boolean> {
  try {
    if (!isValidEmail(recipientEmail)) {
      throw new Error("Invalid recipient email format");
    }

    // Validate work items
    if (!workItems || workItems.length === 0) {
      throw new Error("No work items to share");
    }

    // Create work items list for the email
    const workItemsList = workItems
      .map((item) => {
        const typeEmoji = {
          task: "✅",
          note: "📝",
          photo: "📸",
        }[item.type];

        return `
        <li style="margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 18px;">${typeEmoji}</span>
            <strong style="color: #1e293b; font-size: 16px;">${item.title}</strong>
            ${item.status === "completed" ? '<span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">✓ Completed</span>' : ""}
          </div>
          ${item.subject ? `<div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Subject: ${item.subject}</div>` : ""}
          ${item.preview ? `<div style="color: #64748b; font-size: 14px; line-height: 1.4;">${item.preview.substring(0, 100)}${item.preview.length > 100 ? "..." : ""}</div>` : ""}
          <div style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Date: ${item.date}</div>
        </li>
      `;
      })
      .join("");

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">📚 Work Shared!</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${studentName} has shared their learning progress with you</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          ${
            message
              ? `
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 16px;">💬 Message from ${studentName}:</h3>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">${message}</p>
            </div>
          `
              : ""
          }

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
    `;

    // Try MailerSend first if available
    if (isMailerSendEnabled && mailerSend) {
      const recipients = [new Recipient(recipientEmail, "Learning Coach")];
      const emailParams = new EmailParams()
        .setFrom(defaultSender)
        .setTo(recipients)
        .setSubject(`📚 ${studentName} has shared their work with you`)
        .setHtml(emailHtml);

      await mailerSend.email.send(emailParams);
      console.log("✅ Shared work email sent via MailerSend");
      return true;
    }

    // Fallback to SMTP/transporter
    if (transporter) {
      const mailOptions = {
        from:
          process.env.FROM_EMAIL || "no-reply@student-learning-platform.com",
        to: recipientEmail,
        subject: `📚 ${studentName} has shared their work with you`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Shared work email sent via SMTP:", info.messageId);

      // If using Ethereal, log the preview URL
      if (process.env.NODE_ENV === "development" && info.messageId) {
        console.log("📧 Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
      return true;
    }

    throw new Error("No email transport available");
  } catch (error) {
    console.error("❌ Error sending shared work email:", error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    if (isMailerSendEnabled) {
      console.log("✅ MailerSend is configured");
      return true;
    }

    if (transporter) {
      // Test the transporter
      await transporter.verify();
      console.log("✅ SMTP transporter is configured");
      return true;
    }

    console.warn("⚠️ No email configuration found");
    return false;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error);
    return false;
  }
}
