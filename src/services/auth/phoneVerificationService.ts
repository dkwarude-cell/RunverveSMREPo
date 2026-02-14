/**
 * DEV phone verification service — auto-accepts any 6-digit code.
 * Replace with real Twilio/Firebase verification in production.
 */

export async function sendCode(_phoneNumber: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  // DEV: code is always 123456
  console.log('[DEV] Verification code sent: 123456');
}

export async function verifyCode(
  _userId: string,
  _phoneNumber: string,
  code: string,
): Promise<{ success: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 500));

  // DEV: accept any 6-digit code
  if (code.length === 6) {
    return { success: true, message: 'Phone verified successfully' };
  }

  throw { code: 'invalid-code', message: 'Invalid code' };
}

export async function sendCodeViaCall(_phoneNumber: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[DEV] Verification call initiated');
}

export async function sendCodeViaEmail(_userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[DEV] Verification email sent');
}
