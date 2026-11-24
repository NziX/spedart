import axios from "axios";

interface ISmsResponse {
  sent: boolean;
  error?: string;
  simulated?: boolean;
}

export const sendSMS = async ({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<ISmsResponse> => {
  // 1. If Twilio is configured
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");
      const params = new URLSearchParams();
      params.append("To", to);
      params.append("From", process.env.TWILIO_PHONE_NUMBER);
      params.append("Body", body);

      await axios.post(url, params.toString(), {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(`[SMS Sent via Twilio to ${to}]`);
      return { sent: true };
    } catch (err: any) {
      console.error("Twilio SMS Error:", err?.response?.data || err?.message);
    }
  }

  // 2. If a custom SMS gateway webhook is configured (e.g. Africa's Talking / custom SMS provider)
  if (process.env.SMS_GATEWAY_URL) {
    try {
      await axios.post(
        process.env.SMS_GATEWAY_URL,
        { to, message: body, body },
        {
          headers: process.env.SMS_GATEWAY_API_KEY
            ? { Authorization: `Bearer ${process.env.SMS_GATEWAY_API_KEY}` }
            : {},
        }
      );
      console.log(`[SMS Sent via Gateway to ${to}]`);
      return { sent: true };
    } catch (err: any) {
      console.error("SMS Gateway Error:", err?.response?.data || err?.message);
    }
  }

  // 3. Fallback / Dev Mode: Always log verification code to server logs
  console.log(`\n========================================`);
  console.log(`[SMS NOTIFICATION TO ${to}]`);
  console.log(`Message: ${body}`);
  console.log(`========================================\n`);

  return { sent: true, simulated: true };
};
