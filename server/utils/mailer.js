import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from: `"Vendora Express" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Vendora Express password reset code",
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e1e8ee; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #071a2e 0%, #0aa875 150%); padding: 28px 32px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Vendora Express</h1>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 4px; color: #102033; font-size: 16px; font-weight: 600;">
        Reset your password
      </p>
      <p style="margin: 0 0 24px; color: #6e7c8b; font-size: 14px; line-height: 1.5;">
        Use the verification code below to continue resetting your password. This code is valid for 10 minutes.
      </p>
      <div style="background: #f0faf6; border: 1px dashed #0aa875; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #078f67;">
          ${code}
        </span>
      </div>
      <p style="margin: 0; color: #6e7c8b; font-size: 13px; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email — your password won't be changed.
      </p>
    </div>
    <div style="background: #f7fafc; padding: 16px 32px; border-top: 1px solid #e1e8ee;">
      <p style="margin: 0; color: #9aa8b3; font-size: 11px;">
        © ${new Date().getFullYear()} Vendora Express. This is an automated message, please do not reply.
      </p>
    </div>
  </div>
`,
  });
}
