import brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

function buildEmail({ to, subject, heading, message, code }) {
  const email = new brevo.SendSmtpEmail();
  email.sender = { name: "Vendora Express", email: process.env.EMAIL_USER };
  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e1e8ee; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #071a2e 0%, #0aa875 150%); padding: 28px 32px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Vendora Express</h1>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 4px; color: #102033; font-size: 16px; font-weight: 600;">
        ${heading}
      </p>
      <p style="margin: 0 0 24px; color: #6e7c8b; font-size: 14px; line-height: 1.5;">
        ${message}
      </p>
      <div style="background: #f0faf6; border: 1px dashed #0aa875; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #078f67;">
          ${code}
        </span>
      </div>
    </div>
    <div style="background: #f7fafc; padding: 16px 32px; border-top: 1px solid #e1e8ee;">
      <p style="margin: 0; color: #9aa8b3; font-size: 11px;">
        © ${new Date().getFullYear()} Vendora Express. This is an automated message, please do not reply.
      </p>
    </div>
  </div>
`;
  return email;
}

export async function sendOtpEmail(to, code) {
  const email = buildEmail({
    to,
    subject: "Your Vendora Express password reset code",
    heading: "Reset your password",
    message:
      "Use the verification code below to continue resetting your password. This code is valid for 10 minutes.",
    code,
  });
  await apiInstance.sendTransacEmail(email);
}

export async function sendLoginOtpEmail(to, code) {
  const email = buildEmail({
    to,
    subject: "Your Vendora Express sign-in code",
    heading: "New sign-in detected",
    message:
      "We noticed a sign-in attempt from a device we don't recognize. Enter the code below to confirm it's you. This code is valid for 10 minutes.",
    code,
  });
  await apiInstance.sendTransacEmail(email);
}
