import nodemailer = require('nodemailer');
import axios from 'axios';

interface IResponse {
  error?: string;
  sent: boolean;
  simulated?: boolean;
}

export const sendEmail = async ({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<IResponse> => {
  // 1. If Resend HTTPS API Key is configured (uses port 443, never blocked on Render free tier)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromEmail,
          to: [to],
          subject: subject,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              ${body}
            </div>
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`[Email Sent via Resend API to ${to}]`);
      return { sent: true };
    } catch (err: any) {
      console.error('Resend API Error:', err?.response?.data || err?.message);
    }
  }

  // 2. If Hostinger / SMTP is configured
  if (process.env.EMAIL && process.env.PASSWORD) {
    try {
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: subject,
        html: `
          <div style="text-align: center; font-size: 20px; font-weight: bold;">
          </div>
          <div style="text-align: center; font-size: 30px; margin-top: 10px;">
            ${body}
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Sent via SMTP to ${to}]`);
      return { sent: true };
    } catch (err: any) {
      console.error(`[SMTP Error sending to ${to}]:`, err?.message || err);
      return {
        sent: false,
        error: err?.message || 'SMTP delivery failed',
      };
    }
  }

  // 3. Fallback / Dev Mode: No email provider configured
  console.log(`\n========================================`);
  console.log(`[SIMULATED EMAIL TO ${to}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log(`========================================\n`);

  return {
    sent: false,
    simulated: true,
    error: 'No email service credentials (RESEND_API_KEY or EMAIL/PASSWORD) configured.',
  };
};
