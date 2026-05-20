/**
 * ============================================================
 * FinovaWealth — Email Service (Nodemailer)
 * File: services/emailService.js
 * ============================================================
 * Reusable email dispatcher using Gmail SMTP.
 *
 * Exposes two functions:
 *   • sendEmail(to, subject, html) — generic sender
 *   • sendOTPEmail(to, otp)        — branded OTP template
 *
 * Gmail setup:
 *   1. Enable 2FA on your Google account
 *   2. Generate an App Password (Google → Security → App Passwords)
 *   3. Set EMAIL_USER and EMAIL_PASS in .env
 * ============================================================
 */

const nodemailer = require("nodemailer");

/* ── Transporter (created once, reused) ───────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a generic email.
 * @param {string} to      — Recipient email address
 * @param {string} subject — Email subject line
 * @param {string} html    — Email body as HTML
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"FinovaWealth" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧  Email sent to ${to} — MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌  Email send failed: ${error.message}`);
    throw new Error("Failed to send email. Please try again later.");
  }
};

/**
 * Send a branded OTP verification email.
 * @param {string} to  — Recipient email address
 * @param {string} otp — The 6-digit OTP code
 */
const sendOTPEmail = async (to, otp) => {
  const subject = "FinovaWealth — Verify Your Email";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#ffffff; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 40px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:1px;">
                    FinovaWealth
                  </h1>
                  <p style="margin:6px 0 0; color:#94a3b8; font-size:13px;">
                    Smart Investing Starts Here
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <h2 style="margin:0 0 12px; color:#1e293b; font-size:20px;">
                    Verify Your Email
                  </h2>
                  <p style="margin:0 0 24px; color:#64748b; font-size:15px; line-height:1.6;">
                    Use the code below to complete your registration.
                    This code expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <div style="text-align:center; margin:0 0 28px;">
                    <span style="display:inline-block; background:#f1f5f9; border:2px dashed #3b82f6;
                      border-radius:8px; padding:16px 40px; font-size:32px; font-weight:700;
                      letter-spacing:10px; color:#1e293b;">
                      ${otp}
                    </span>
                  </div>

                  <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.5;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc; padding:20px 40px; text-align:center;
                  border-top:1px solid #e2e8f0;">
                  <p style="margin:0; color:#94a3b8; font-size:12px;">
                    &copy; ${new Date().getFullYear()} FinovaWealth. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
};

module.exports = { sendEmail, sendOTPEmail };
