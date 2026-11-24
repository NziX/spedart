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
  const emailUser = process.env.EMAIL || 'supportmainspedart@gmail.com';
  const emailPass = process.env.PASSWORD || process.env.GMAIL_APP_PASSWORD || '';
  const fromName = process.env.EMAIL_NAME || 'SpedArt';
  const fromAddress = `"${fromName}" <${emailUser}>`;

  // 1. If SMTP / Gmail credentials are configured (preferred: sends directly from supportmainspedart@gmail.com)
  if (emailPass) {
    try {
      const isGmail = emailUser.toLowerCase().includes('gmail.com');
      const smtpPort = Number(process.env.SMTP_PORT) || 465;

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          })
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });

      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">SpedArt</h1>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Artist Platform & Pre-Releases</p>
            </div>
            <div style="color: #374151; font-size: 15px; line-height: 1.6; padding-top: 20px;">
              ${body}
            </div>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 30px 0 16px 0;" />
            <div style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0;">Sent by <strong>SpedArt</strong> &bull; <a href="mailto:${emailUser}" style="color: #4F46E5; text-decoration: none;">${emailUser}</a></p>
              <p style="margin: 4px 0 0 0;">This is an automated message. If you did not make this request, please disregard it.</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent from ${emailUser} via SMTP to ${to}]:`, info.messageId);

      // Check for rejected recipients
      if (info.rejected && info.rejected.length > 0) {
        return {
          sent: false,
          error: `The email address "${to}" was rejected by the mail server. It does not exist or cannot accept mail.`,
        };
      }

      return { sent: true };
    } catch (err: any) {
      console.error(`[SMTP Error sending from ${emailUser} to ${to}]:`, err?.message || err);

      let userFriendlyError = err?.message || 'SMTP delivery failed';
      if (err?.responseCode === 550 || err?.code === 'EENVELOPE') {
        userFriendlyError = `The email address "${to}" does not exist or was rejected by the mail server.`;
      } else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED') {
        userFriendlyError = 'Could not connect to Gmail SMTP server. Please verify network access or try again shortly.';
      } else if (err?.responseCode === 535 || err?.message?.includes('Invalid login') || err?.message?.includes('Username and Password not accepted')) {
        userFriendlyError = `Gmail authentication failed for ${emailUser}. Please verify that a 16-character Google App Password is set in the PASSWORD environment variable.`;
      }

      return {
        sent: false,
        error: userFriendlyError,
      };
    }
  }

  // 2. If Resend HTTPS API Key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'SpedArt <onboarding@resend.dev>';
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromEmail,
          to: [to],
          reply_to: emailUser,
          subject: subject,
          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #ffffff;">
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
                <h1 style="color: #4F46E5; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">SpedArt</h1>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Artist Platform & Pre-Releases</p>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6; padding-top: 20px;">
                ${body}
              </div>
              <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 30px 0 16px 0;" />
              <div style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                <p style="margin: 0;">Sent by <strong>SpedArt</strong> &bull; <a href="mailto:${emailUser}" style="color: #4F46E5; text-decoration: none;">${emailUser}</a></p>
                <p style="margin: 4px 0 0 0;">This is an automated message. If you did not make this request, please disregard it.</p>
              </div>
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

  console.error(`[Email Service Not Configured]: Neither PASSWORD for ${emailUser} nor RESEND_API_KEY are set.`);
  return {
    sent: false,
    error: `Email service is not fully configured for ${emailUser}. Please set the PASSWORD environment variable (Google App Password) on the server.`,
  };
};
