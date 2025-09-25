// server/email.ts
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import cryptoRandomString from "crypto-random-string";
import { storage } from "./storage";

// Initialize MailerSend with your API key
const mailerSend = new MailerSend({
  apiKey:
    process.env.MAILERSEND_API_KEY ||
    "mlsn.65988d9b4c0698b2e81995d16f0c665544fa6569110b4977e973174fa4271030",
});

// Generate a secure random token
export function generateToken(): string {
  return cryptoRandomString({ length: 32, type: "url-safe" });
}

// Set a password reset token for a user
export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
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

// Send a password reset email using MailerSend
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<boolean> {
  try {
    console.log("Attempting to send password reset email to:", email);

    const sentFrom = new Sender(
      "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
      "Student Task Tracker",
    );
    const recipients = [new Recipient(email, email)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Reset Your Password - Student Task Tracker").setHtml(`
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
      `).setText(`
        Reset Your Password - Student Task Tracker

        Hello,

        We received a request to reset your password. If you didn't make this request, you can ignore this email.

        To reset your password, visit the following link:
        ${resetUrl}

        This link will expire in 1 hour.

        Best regards,
        The Student Task Tracker Team
      `);

    console.log("Sending password reset email with params:", {
      from: "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
      to: email,
      subject: "Reset Your Password - Student Task Tracker",
    });

    const response = await mailerSend.email.send(emailParams);
    console.log("Password reset email sent successfully:", response);
    return true;
  } catch (error: any) {
    console.error("Error sending password reset email:", {
      error: error.message,
      stack: error.stack,
      apiKey: process.env.MAILERSEND_API_KEY
        ? "***" + process.env.MAILERSEND_API_KEY.slice(-4)
        : "Not set",
    });
    return false;
  }
}

// Send a task share email using MailerSend - UPDATED VERSION
export async function sendTaskShareEmail(emailContent: any): Promise<boolean> {
  try {
    console.log("Attempting to send task share email:", {
      to: emailContent.to,
      fromName: emailContent.fromName,
      taskTitle: emailContent.taskTitle,
      hasCustomMessage: !!emailContent.customMessage,
      hasProof: emailContent.hasProof,
    });

    // Handle both new object format and old parameter format
    const recipientEmail = emailContent.to || emailContent;
    const senderName = emailContent.fromName || emailContent;
    const taskTitle = emailContent.taskTitle || emailContent;
    const taskDescription = emailContent.taskDescription || emailContent;
    const shareUrl = emailContent.shareUrl || emailContent;
    const customMessage = emailContent.customMessage || "";

    if (typeof recipientEmail === "object") {
      // We're using the new format, use the extracted values
    } else {
      // We're using the old format, use the parameters directly
      console.log("Using old parameter format for email");
    }

    const sentFrom = new Sender(
      "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
      "Student Task Tracker",
    );
    const recipients = [new Recipient(recipientEmail, recipientEmail)];

    // Build email content with proof information if available
    let proofSection = "";
    if (emailContent.hasProof) {
      proofSection = `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #856404; margin-top: 0;">Proof of Work Included</h4>
          ${emailContent.proofText ? `<p><strong>Notes:</strong> ${emailContent.proofText}</p>` : ""}
          ${emailContent.proofLink ? `<p><strong>Link:</strong> <a href="${emailContent.proofLink}">${emailContent.proofLink}</a></p>` : ""}
          ${emailContent.proofFilesCount > 0 ? `<p><strong>Files:</strong> ${emailContent.proofFilesCount} file(s) attached</p>` : ""}
        </div>
      `;
    }

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(`${senderName} shared a task with you: ${taskTitle}`)
      .setHtml(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Task Shared with You</h2>
          <p>Hello,</p>
          <p><strong>${senderName}</strong> has shared a task with you:</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: #374151; margin-top: 0;">${taskTitle}</h3>
            <p style="color: #6b7280; margin-bottom: 0;">${taskDescription || "No description provided."}</p>
          </div>

          ${
            customMessage
              ? `
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #0366d6; margin-top: 0;">Message from ${senderName}:</h4>
              <p style="color: #586069;">${customMessage}</p>
            </div>
          `
              : ""
          }

          ${proofSection}

          <p>Click the button below to view the task:</p>
          <p style="text-align: center;">
            <a href="${shareUrl}" 
               style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
               View Task
            </a>
          </p>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${shareUrl}</p>

          <p>Best regards,<br>The Student Task Tracker Team</p>
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <img src="https://aliud-alternative.com/logo.png" alt="Aliud Alternative Logo" width="120" />
          </div>
        </div>
      `).setText(`
        Task Shared with You

        Hello,

        ${senderName} has shared a task with you:

        Task: ${taskTitle}
        Description: ${taskDescription || "No description provided."}

        ${customMessage ? `Message from ${senderName}: ${customMessage}` : ""}

        ${
          emailContent.hasProof
            ? `
        Proof of Work Included:
        ${emailContent.proofText ? `Notes: ${emailContent.proofText}` : ""}
        ${emailContent.proofLink ? `Link: ${emailContent.proofLink}` : ""}
        ${emailContent.proofFilesCount > 0 ? `Files: ${emailContent.proofFilesCount} file(s) attached` : ""}
        `
            : ""
        }

        View the task at: ${shareUrl}

        Best regards,
        The Student Task Tracker Team
      `);

    console.log("Sending task share email with MailerSend...");
    const response = await mailerSend.email.send(emailParams);
    console.log("Task share email sent successfully to:", recipientEmail);
    return true;
  } catch (error: any) {
    console.error("Error sending task share email:", {
      error: error.message,
      stack: error.stack,
      apiKey: process.env.MAILERSEND_API_KEY
        ? "***" + process.env.MAILERSEND_API_KEY.slice(-4)
        : "Not set",
      emailContent: {
        to: emailContent.to,
        fromName: emailContent.fromName,
        taskTitle: emailContent.taskTitle,
      },
    });
    return false;
  }
}

// NEW: Send multiple items to coach email
export async function sendCoachShareEmail(emailContent: any): Promise<boolean> {
  try {
    console.log("Attempting to send coach share email:", {
      to: emailContent.to,
      studentName: emailContent.studentName,
      itemCount: emailContent.totalItems,
    });

    const sentFrom = new Sender(
      "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
      "Student Task Tracker",
    );
    const recipients = [new Recipient(emailContent.to, emailContent.to)];

    // Build items list for email with proof content
    let itemsList = "";
    emailContent.items.forEach((item: any, index: number) => {
      // Build proof section for each item
      let proofContent = "";
      
      // Handle task items with proof files, text, or links
      if (item.type === 'task') {
        if (item.proofFiles && item.proofFiles.length > 0) {
          proofContent += `
            <div style="background-color: #f8f9ff; padding: 10px; margin: 5px 0; border-radius: 4px;">
              <strong>📎 Uploaded Files (${item.proofFiles.length}):</strong><br>
              ${item.proofFiles.map((file: string, fileIndex: number) => {
                const isImage = file.startsWith('data:image/');
                if (isImage) {
                  return `
                    <div style="margin: 5px 0;">
                      <strong>Image ${fileIndex + 1}:</strong><br>
                      <img src="${file}" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;" alt="Proof Image ${fileIndex + 1}">
                    </div>
                  `;
                } else {
                  return `<div style="margin: 5px 0;"><strong>File ${fileIndex + 1}:</strong> [Attachment included]</div>`;
                }
              }).join('')}
            </div>
          `;
        }
        
        if (item.proofText) {
          proofContent += `
            <div style="background-color: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px;">
              <strong>📝 Student Notes:</strong><br>
              <p style="margin: 5px 0; font-style: italic;">"${item.proofText}"</p>
            </div>
          `;
        }
        
        if (item.proofLink) {
          proofContent += `
            <div style="background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 4px;">
              <strong>🔗 Reference Link:</strong><br>
              <a href="${item.proofLink}" style="color: #0366d6; text-decoration: underline;">${item.proofLink}</a>
            </div>
          `;
        }
      }
      
      // Handle regular portfolio items
      if (item.attachments && item.attachments.length > 0) {
        proofContent += `
          <div style="background-color: #f8f9ff; padding: 10px; margin: 5px 0; border-radius: 4px;">
            <strong>📎 Attachments (${item.attachments.length}):</strong><br>
            ${item.attachments.map((attachment: any, attIndex: number) => {
              if (attachment.type === 'photo' && attachment.url) {
                return `
                  <div style="margin: 5px 0;">
                    <strong>${attachment.name || `Image ${attIndex + 1}`}:</strong><br>
                    <img src="${attachment.url}" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;" alt="${attachment.name}">
                  </div>
                `;
              } else if (attachment.type === 'link' && attachment.url) {
                return `<div style="margin: 5px 0;"><strong>🔗 Link:</strong> <a href="${attachment.url}" style="color: #0366d6;">${attachment.name || attachment.url}</a></div>`;
              } else {
                return `<div style="margin: 5px 0;"><strong>📄 ${attachment.name || `File ${attIndex + 1}`}:</strong> ${attachment.type} attachment</div>`;
              }
            }).join('')}
          </div>
        `;
      }

      itemsList += `
        <div style="border: 1px solid #e1e5e9; padding: 15px; margin: 10px 0; border-radius: 8px; background-color: #fafbfc;">
          <strong style="font-size: 16px; color: #374151;">${index + 1}. ${item.title}</strong> 
          <span style="background-color: #6366f1; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">${item.type}</span>
          ${item.description ? `<br><p style="margin: 8px 0; color: #6b7280;">${item.description}</p>` : ""}
          <div style="margin: 8px 0; font-size: 12px; color: #9ca3af;">
            <strong>Subject:</strong> ${item.subject || "Not specified"} | 
            <strong>Date:</strong> ${item.date || new Date(item.createdAt || Date.now()).toLocaleDateString()}
          </div>
          ${proofContent}
        </div>
      `;
    });

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(
        `Student Work Shared - ${emailContent.totalItems} Items from ${emailContent.studentName}`,
      ).setHtml(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Student Work Shared with You</h2>
          <p>Hello,</p>
          <p><strong>${emailContent.studentName}</strong> has shared ${emailContent.totalItems} work items with you for review.</p>

          ${
            emailContent.message
              ? `
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #0366d6; margin-top: 0;">Message from ${emailContent.studentName}:</h4>
              <p style="color: #586069;">${emailContent.message}</p>
            </div>
          `
              : ""
          }

          <h3 style="color: #374151;">Shared Items (${emailContent.totalItems}):</h3>
          ${itemsList}

          <p>Please log in to the Student Task Tracker platform to review these items and provide feedback.</p>

          <p>Best regards,<br>The Student Task Tracker Team</p>
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <img src="https://aliud-alternative.com/logo.png" alt="Aliud Alternative Logo" width="120" />
          </div>
        </div>
      `).setText(`
        Student Work Shared with You

        Hello,

        ${emailContent.studentName} has shared ${emailContent.totalItems} work items with you for review.

        ${emailContent.message ? `Message from ${emailContent.studentName}: ${emailContent.message}` : ""}

        Shared Items:
        ${emailContent.items
          .map(
            (item: any, index: number) =>
              `${index + 1}. ${item.title} (${item.type}) - ${item.subject || "Not specified"} - ${item.date}`,
          )
          .join("\n")}

        Please log in to the Student Task Tracker platform to review these items.

        Best regards,
        The Student Task Tracker Team
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log("Coach share email sent successfully to:", emailContent.to);
    return true;
  } catch (error: any) {
    console.error("Error sending coach share email:", error);
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

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    console.log("Testing email configuration...");
    console.log(
      "MAILERSEND_API_KEY:",
      process.env.MAILERSEND_API_KEY
        ? "***" + process.env.MAILERSEND_API_KEY.slice(-4)
        : "Not set",
    );

    // Try a simple API call to check connectivity
    const sentFrom = new Sender(
      "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
      "Test",
    );
    const recipients = [new Recipient("test@example.com", "Test Recipient")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Test Email Configuration")
      .setText("This is a test email to check configuration.");

    // Don't actually send, just check if we can create the params
    console.log(
      "Email configuration test completed - able to create email parameters",
    );
    return true;
  } catch (error: any) {
    console.error("Email configuration test failed:", error);
    return false;
  }
}
