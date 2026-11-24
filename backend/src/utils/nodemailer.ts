import nodemailer = require('nodemailer');
import axios from 'axios';

interface IResponse {
  error?: string;
  sent: boolean;
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
      const apiErr = err?.response?.data?.message || err?.message || 'Resend API delivery error';
      console.error('Resend API Error:', err?.response?.data || err?.message);
      return {
        sent: false,
        error: apiErr,
      };
    }
  }

  // 2. If Hostinger / SMTP is configured
  if (process.env.EMAIL && process.env.PASSWORD) {
    try {
      const smtpPort = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: `"Supported" <${process.env.EMAIL}>`,
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

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent via SMTP to ${to}]:`, info.messageId);

      // Check for rejected recipients
      if (info.rejected && info.rejected.length > 0) {
        return {
          sent: false,
          error: `The email address "${to}" was rejected by the mail server. It does not exist or cannot accept mail.`,
        };
      }

      return { sent: true };
    } catch (err: any) {
      console.error(`[SMTP Error sending to ${to}]:`, err?.message || err);

      let userFriendlyError = err?.message || 'SMTP delivery failed';
      if (err?.responseCode === 550 || err?.code === 'EENVELOPE') {
        userFriendlyError = `The email address "${to}" does not exist or was rejected by the mail server.`;
      } else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED') {
        userFriendlyError = 'Could not connect to email mail server. Please try again shortly.';
      }

      return {
        sent: false,
        error: userFriendlyError,
      };
    }
  }

  console.error(`[Email Service Not Configured]: Neither RESEND_API_KEY nor EMAIL/PASSWORD are set.`);
  return {
    sent: false,
    error: 'Email service is not configured on the server. Please check environment variables or contact support.',
  };
};
