import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "~/env";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  const port = env.SMTP_PORT ?? 465;
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit SSL, 587 = STARTTLS
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return cachedTransporter;
}

function fromAddress(): string {
  return env.SMTP_FROM ?? env.SMTP_USER ?? "no-reply@azziop.com";
}

/**
 * Sends an email. When SMTP is not configured, falls back to logging the
 * message to the server console so flows remain testable in development.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `[mailer] SMTP not configured — email not sent.\n  To: ${input.to}\n  Subject: ${input.subject}\n  ${input.text}`,
    );
    return;
  }

  await transporter.sendMail({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const subject = "Reset your Azziop password";
  const text = `We received a request to reset your Azziop password.\n\nReset it here (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #171717;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #404040; margin: 0 0 24px;">
      We received a request to reset your Azziop password. Click the button below to choose a new one. This link expires in 1 hour.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: #FAD400; color: #171717; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 12px;">
      Reset password
    </a>
    <p style="font-size: 13px; line-height: 1.6; color: #737373; margin: 24px 0 0;">
      Or paste this link into your browser:<br />
      <a href="${resetUrl}" style="color: #404040; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #a3a3a3; margin: 24px 0 0;">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  </div>`;

  await sendEmail({ to, subject, html, text });
}
