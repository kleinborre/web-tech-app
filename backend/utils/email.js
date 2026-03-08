/**
 * ImageToTextOnline - Email Utility
 * 
 * Sends transactional emails using Gmail SMTP via nodemailer.
 * 
 * @version 1.0.0
 */

import nodemailer from 'nodemailer';

/* ==========================================================================
   SMTP TRANSPORTER
   ========================================================================== */

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/* ==========================================================================
   EMAIL TEMPLATES
   ========================================================================== */

/**
 * Send a password reset email with a branded HTML template.
 * 
 * @param {string} toEmail - Recipient email address
 * @param {string} resetUrl - Full URL with token for password reset
 * @param {string} username - User's display name
 */
export const sendPasswordResetEmail = async (toEmail, resetUrl, username) => {
    // Validate SMTP config exists
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[Email] SMTP_USER or SMTP_PASS not configured in environment variables');
        throw new Error('Email service is not configured. Please set SMTP_USER and SMTP_PASS.');
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"ImageToTextOnline" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Reset Your Password - ImageToTextOnline',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #0097b2, #007a91); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">
                            Password Reset Request
                        </h1>
                    </div>

                    <!-- Body -->
                    <div style="padding: 32px 24px;">
                        <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                            Hi <strong>${username}</strong>,
                        </p>
                        <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.6;">
                            We received a request to reset your password for your ImageToTextOnline account. Click the button below to set a new password:
                        </p>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetUrl}" style="
                                display: inline-block; padding: 14px 36px;
                                background: linear-gradient(135deg, #0097b2, #007a91);
                                color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;
                                border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 151, 178, 0.3);
                            ">Reset Password</a>
                        </div>

                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            This link will expire in <strong>15 minutes</strong> for security reasons.
                        </p>
                        <p style="margin: 0 0 24px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            If you didn't request this, you can safely ignore this email.
                        </p>

                        <!-- Fallback Link -->
                        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; word-break: break-all; font-size: 12px; color: #0097b2;">
                                ${resetUrl}
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px 24px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            © ${new Date().getFullYear()} ImageToTextOnline. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent to ${toEmail} (messageId: ${info.messageId})`);
    return info;
};
