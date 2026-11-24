import * as dns from 'dns';
import * as util from 'util';

const resolveMx = util.promisify(dns.resolveMx);

/**
 * Validates that an email has valid syntax and that its domain
 * actually exists and has active MX (Mail Exchange) servers to receive email.
 */
export async function validateEmailExistence(
  email: string
): Promise<{ valid: boolean; message?: string }> {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Basic RFC 5322 regex syntax check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      message: 'The email address format is invalid.',
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[1]) {
    return { valid: false, message: 'The email address format is invalid.' };
  }

  const domain = parts[1];

  // 2. DNS MX records check to verify domain exists and receives mail
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        message: `The domain "${domain}" does not have active mail servers to receive emails.`,
      };
    }
    return { valid: true };
  } catch (err: any) {
    if (err?.code === 'ENOTFOUND' || err?.code === 'ENODATA' || err?.code === 'SERVFAIL') {
      return {
        valid: false,
        message: `The email domain "${domain}" does not exist. Please check your email address.`,
      };
    }
    // If DNS query times out or local DNS lookup is restricted, allow it through to SMTP attempt
    return { valid: true };
  }
}
