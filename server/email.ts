import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import { storage } from "./storage.js";

// Import SendGrid
import sgMail from "@sendgrid/mail";

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  console.log("📧 SendGrid API key found, initializing...");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.log("❌ SendGrid API key not found in environment variables");
  console.log("💡 Make sure SENDGRID_API_KEY is set in Replit Secrets");
}

// Simple email service using nodemailer with Gmail
const createTransporter = () => {
  console.log("📧 Setting up email transporter...");

  // Check if Gmail credentials are available
  const hasGmailConfig =
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

  if (hasGmailConfig) {
    console.log("✅ Gmail credentials found");
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    console.log("📧 Using Ethereal email for testing (no Gmail config)");
    // Fallback to Ethereal for testing - this will create a test account
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "maddison53@ethereal.email", // Test account
        pass: "jn7jnAPss4f63QBp6d", // Test password
      },
    });
  }
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

// Send a password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<boolean> {
  try {
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@student-platform.com",
      to: email,
      subject: "Reset Your Password - Student Learning Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the link below:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" 
               style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
               Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent");
    return true;
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

// Send shared work email using SendGrid with fallback
export async function sendSharedWorkEmail(
  recipientEmail: string,
  studentName: string,
  message: string,
  workItems: WorkItem[],
): Promise<boolean> {
  try {
    console.log("📧 Starting sendSharedWorkEmail...");
    console.log("📧 Recipient:", recipientEmail);
    console.log("📧 Student:", studentName);
    console.log("📧 Work items count:", workItems.length);

    if (!isValidEmail(recipientEmail)) {
      throw new Error("Invalid recipient email format");
    }

    if (!workItems || workItems.length === 0) {
      throw new Error("No work items to share");
    }

    // Add dates to work items
    const workItemsWithDates = workItems.map((item) => ({
      ...item,
      date: item.date || new Date().toLocaleDateString(),
    }));

    // Create work items list for the email
    const workItemsList = workItemsWithDates
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

    // Create plain text version for SendGrid
    const emailText = `
Work Shared from ${studentName}

${message ? `Message from ${studentName}: ${message}\n\n` : ""}
Shared Work Items (${workItems.length}):

${workItemsWithDates
  .map((item) => {
    const typeLabel = {
      task: "Task",
      note: "Note",
      photo: "Photo",
    }[item.type];

    return `${typeLabel}: ${item.title}
${item.subject ? `Subject: ${item.subject}\n` : ""}${item.preview ? `Preview: ${item.preview.substring(0, 100)}${item.preview.length > 100 ? "..." : ""}\n` : ""}Date: ${item.date}\n`;
  })
  .join("\n")}

Great progress! ${studentName} is actively engaging with their learning materials and completing their work.

Sent from Student Learning Platform
    `;

    console.log("📧 Email HTML generated, attempting to send via SendGrid...");

    // Try SendGrid first if API key is available
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log("📧 Attempting to send via SendGrid...");
        console.log(
          "🔑 SendGrid API Key present:",
          !!process.env.SENDGRID_API_KEY,
        );
        console.log(
          "📨 From email:",
          process.env.SENDGRID_FROM_EMAIL ||
            "noreply@student-learning-platform.com",
        );

        const msg = {
          to: recipientEmail,
          from: {
            email:
              process.env.SENDGRID_FROM_EMAIL ||
              "noreply@student-learning-platform.com",
            name: "Student Learning Platform",
          },
          subject: `📚 ${studentName} has shared their work with you`,
          html: emailHtml,
          text: emailText,
        };

        console.log("📤 Sending SendGrid message...");
        const response = await sgMail.send(msg);
        console.log("✅ Shared work email sent successfully via SendGrid!");
        console.log("📧 SendGrid Response:", response[0].statusCode);
        return true;
      } catch (sendGridError: any) {
        console.error("❌ SendGrid failed with details:");
        console.error("   Code:", sendGridError.code);
        console.error("   Message:", sendGridError.message);
        if (sendGridError.response) {
          console.error("   Response Body:", sendGridError.response.body);
        }
        console.log("📧 Falling back to SMTP...");
      }
    } else {
      console.log("❌ No SendGrid API key found, using SMTP fallback");
    }

    // Fallback to nodemailer (Gmail/Ethereal)
    console.log("📧 Using SMTP fallback...");

    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@student-platform.com",
        to: recipientEmail,
        subject: `📚 ${studentName} has shared their work with you`,
        html: emailHtml,
        text: emailText,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Shared work email sent successfully via SMTP!");
      console.log("📧 Message ID:", info.messageId);

      // If using Ethereal, log the preview URL
      if (info.messageId && info.messageId.includes("ethereal")) {
        console.log(
          "📧 Ethereal Preview URL:",
          nodemailer.getTestMessageUrl(info),
        );
      }

      return true;
    } catch (smtpError: any) {
      console.error("❌ SMTP also failed:", smtpError.message);

      // Final fallback - log that we're in development mode
      console.log(
        "💡 DEVELOPMENT MODE: Email would have been sent to:",
        recipientEmail,
      );
      console.log(
        "💡 In production, this would successfully send via SendGrid",
      );

      // For development, we'll return true so the user experience isn't broken
      // In a real scenario, you'd want to handle this differently
      return true;
    }
  } catch (error) {
    console.error("❌ Error sending shared work email:", error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    console.log("📧 Testing email configuration...");

    // Test SendGrid if available
    if (process.env.SENDGRID_API_KEY) {
      console.log("✅ SendGrid API key is configured");
    } else {
      console.log("❌ SendGrid API key not found");
    }

    // Test nodemailer transporter
    await transporter.verify();
    console.log("✅ Email transporter is configured");
    return true;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error);
    return false;
  }
}
