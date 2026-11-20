import https from 'https';
import 'dotenv/config';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || 'noreply@smartheal.app';

if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY is not configured in .env file');
}

/*
 * Helper function to make HTTPS requests to Brevo
 */
function makeBrevoRequest(method: string, endpoint: string, payload: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(payload);

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};

          if (
            res.statusCode &&
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {
            resolve(response);
          } else {
            reject(
              new Error(
                `Brevo API Error: ${res.statusCode} - ${JSON.stringify(
                  response
                )}`
              )
            );
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payloadString);
    req.end();
  });
}

/*
 * Brevo Email Service
 */
export class BrevoService {
  /*
   * Send email OTP through Brevo
   */
  static async sendEmailOTP(
    email: string,
    otp: string,
    type: string = 'registration'
  ) {
    try {
      console.log(
        `📧 Sending ${type} OTP via Brevo to: ${email}`
      );

      let subject;
      let htmlContent;

      /*
       * Registration OTP
       */
      if (type === 'registration') {
        subject =
          'SmartHeal - Verify your email for registration';

        htmlContent = `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
          ">

            <h2 style="color: #ef1717;">
              Welcome to SmartHeal!
            </h2>

            <p>
              Thank you for signing up.
              Please verify your email to get started.
            </p>

            <div style="
              background-color: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            ">

              <p style="
                margin: 0;
                color: #6b7280;
                font-size: 14px;
              ">
                Your verification code:
              </p>

              <p style="
                margin: 10px 0;
                font-size: 32px;
                font-weight: bold;
                color: #111827;
                letter-spacing: 2px;
              ">
                ${otp}
              </p>

            </div>

            <p style="color: #6b7280;">
              This code will expire in 5 minutes.
            </p>

            <p style="color: #6b7280;">
              If you didn't sign up for SmartHeal,
              please ignore this email.
            </p>

            <hr style="
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            ">

            <p style="
              color: #9ca3af;
              font-size: 12px;
            ">
              SmartHeal © 2026 - All rights reserved
            </p>

          </div>
        `;
      }

      /*
       * Password Reset OTP
       */
      else {
        subject = 'SmartHeal - Password Reset OTP';

        htmlContent = `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
          ">

            <h2 style="color: #2563EB;">
              Password Reset Request
            </h2>

            <p>
              We received a request to reset your password
              for your SmartHeal account.
            </p>

            <div style="
              background-color: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            ">

              <p style="
                margin: 0;
                color: #6b7280;
                font-size: 14px;
              ">
                Your OTP for password reset:
              </p>

              <p style="
                margin: 10px 0;
                font-size: 32px;
                font-weight: bold;
                color: #111827;
                letter-spacing: 2px;
              ">
                ${otp}
              </p>

            </div>

            <p style="color: #6b7280;">
              This code will expire in 10 minutes.
            </p>

            <p style="color: #6b7280;">
              If you didn't request a password reset,
              please ignore this email and your account
              will remain secure.
            </p>

            <hr style="
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            ">

            <p style="
              color: #9ca3af;
              font-size: 12px;
            ">
              SmartHeal © 2026 - All rights reserved
            </p>

          </div>
        `;
      }

      /*
       * Brevo API payload
       */
      const payload = {
        sender: {
          name: 'SmartHeal',
          email: BREVO_SENDER_EMAIL,
        },

        to: [
          {
            email: email,
          },
        ],

        subject: subject,
        htmlContent: htmlContent,
      };

      /*
       * Send email
       */
      const response = await makeBrevoRequest(
        'POST',
        '/v3/smtp/email',
        payload
      );

      console.log(
        `✅ Email OTP sent successfully. Message ID: ${response.messageId}`
      );

      return response;

    } catch (error) {
      console.error(
        '❌ Error sending email OTP via Brevo:',
        error instanceof Error
          ? error.message
          : error
      );

      throw error;
    }
  }
}