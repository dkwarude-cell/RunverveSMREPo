import { Router } from 'express';
import { auth, db, FieldValue } from '../config/firebase.js';
import { BrevoService } from '../services/brevo.services.js';

const router = Router();

type OtpEntry = {
  otp: string;
  expiry: number;
  email: string;
  fullName?: string;
  phone?: string;
  password?: string;
};

const resetOTPs = new Map<string, OtpEntry>();
const registrationOTPs = new Map<string, OtpEntry>();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getUserByEmail = async (email: string) => {
    try {
      const userRecord = await auth.getUserByEmail(email);

      return {
        firebase_uid: userRecord.uid,
        email: userRecord.email,
      };

    } catch (firebaseError) {
      console.warn('⚠️ Firebase lookup also failed');
      return null;
    }
  }

const getErrorMessage = (error: unknown) => {
  return error instanceof Error
    ? error.message
    : 'Unknown error';
};


/* =========================================================
   PASSWORD RESET
========================================================= */

// Send OTP for password reset
router.post('/sendOTP', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(406).json({
        message: 'User does not exist',
        status: 'Failure',
      });
    }

    const otp = generateOTP();

    resetOTPs.set(normalizedEmail, {
      otp,
      expiry: Date.now() + 5 * 60 * 1000,
      email: normalizedEmail,
    });

    await BrevoService.sendEmailOTP(
      normalizedEmail,
      otp,
      'password-reset'
    );

    console.log(`✅ Password reset OTP sent to ${normalizedEmail}`);
    return res.status(200).json({
      message: 'OTP has been sent to your email.',
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      error: getErrorMessage(error),
    });
  }
});


// Verify OTP for password reset
router.post('/verifyotp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({message: 'Email and OTP are required',});}

    const normalizedEmail = email.toLowerCase().trim();

    const cachedData = resetOTPs.get(normalizedEmail);

    if (!cachedData) {
      return res.status(400).json({message: 'Invalid or expired OTP',});}

    if (cachedData.expiry < Date.now()) {resetOTPs.delete(normalizedEmail);
      return res.status(400).json({message: 'OTP Expired',});}

    if (cachedData.otp !== otp) {
      return res.status(400).json({message: 'Invalid OTP',});}
      return res.status(200).json({message: 'OTP verified',});

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({error: getErrorMessage(error),});
  }
});


// Change password after OTP verification
router.post('/changepassword', async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const cachedData = resetOTPs.get(normalizedEmail);

    if (!cachedData || cachedData.otp !== otp) {
      return res.status(400).json({message: 'Invalid OTP',});}

    if (cachedData.expiry < Date.now()) {
      resetOTPs.delete(normalizedEmail);
      return res.status(400).json({message: 'OTP Expired',});}

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }


    await auth.updateUser(
      user.firebase_uid,
      {
        password: newPassword,
      }
    );

    try {
      await db
        .collection('users')
        .doc(user.firebase_uid)
        .update({
          passwordChangedAt: FieldValue.serverTimestamp(),
          updatedAt:FieldValue.serverTimestamp(),
        });

    } catch (firestoreError) {
      console.warn(
        '⚠️ Firestore update warning:',
        firestoreError
      );
    }

    resetOTPs.delete(normalizedEmail);

    return res.status(200).json({
      message: 'Password reset successfully.',
    });

  } catch (error) {
    console.error('Change Password Error:', error);

    return res.status(500).json({
      error: getErrorMessage(error),
    });
  }
});

/* =========================================================
   REGISTRATION - SEND EMAIL OTP
========================================================= */

router.post(
  '/sendRegistrationOTP',
  async (req, res) => {

    try {
      const {
        email,
        fullName,
        phone,
      } = req.body;

      console.log(
        '📧 Registration OTP request for:',
        email
      );

      if (!email) {
        return res.status(400).json({
          message: 'Email is required',
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();


      /*
       * Check whether the email already exists
       */
      try {
        console.log(
          '🔍 Checking if email already exists...'
        );
        await auth.getUserByEmail(normalizedEmail);
        console.warn(
          '❌ Email already registered:',
          normalizedEmail
        );

        return res.status(400).json({
          message:
            'Email is already registered. Please login instead.',
        });

      } catch (checkError) {

        if (
          (checkError as any).code !==
          'auth/user-not-found'
        ) {
          console.error(
            '❌ Error checking email:',
            checkError
          );

          return res.status(500).json({
            message:
              'Error verifying email. Please try again.',
          });
        }

        console.log(
          '✅ Email is available'
        );
      }
      const otp = generateOTP();
      const otpExpiry =
        Date.now() + 5 * 60 * 1000;

      /*
       * Store OTP
       */
      registrationOTPs.set(
        normalizedEmail,
        {
          otp,
          expiry: otpExpiry,
          email: normalizedEmail,
          fullName,
          phone,
        }
      );


      /*
       * Send ONLY EMAIL OTP through Brevo
       */
      await BrevoService.sendEmailOTP(
        normalizedEmail,
        otp,
        'registration'
      );

      console.log(
        `✅ Registration OTP sent to ${normalizedEmail}`
      );


      return res.status(200).json({
        success: true,
        message:
          'Verification OTP has been sent to your email.',
        email: normalizedEmail,
      });

    } catch (error) {

      console.error(
        '❌ Send Registration OTP Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to send verification OTP.',
        error: getErrorMessage(error),
      });
    }
  }
);


/* =========================================================
   LOGIN
========================================================= */

router.post(
  '/login',
  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;

      console.log(
        '\n🔐 ==================== LOGIN ===================='
      );

      console.log(
        '🔐 Login attempt for:',
        email
      );

      if (!email || !password) {
        return res.status(400).json({
          message:
            'Email and password are required',
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      try {

        const userRecord =
          await auth.getUserByEmail(normalizedEmail);

        if (!userRecord) {
          return res.status(404).json({
            message: 'User not found',
          });
        }

        console.log(
          '✅ User found:',
          userRecord.uid
        );


        /*
         * Validate Firebase password
         */
        try {

          const response = await fetch(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
            process.env.FIREBASE_API_KEY,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                email: normalizedEmail,
                password,
                returnSecureToken: true,
              }),
            }
          );

          const result =
            await response.json();

          if (
            !response.ok ||
            result.error
          ) {
            return res.status(401).json({
              message:
                'Invalid email or password',
            });
          }

          console.log(
            '✅ Password validated successfully'
          );

        } catch (passwordError) {

          console.error(
            '❌ Password validation error:',
            passwordError
          );

          return res.status(401).json({
            message:
              'Invalid email or password',
          });
        }


        /*
         * Get Firestore profile
         */
        const userDoc =
          await db
            .collection('users')
            .doc(userRecord.uid)
            .get();

        const userData =
          userDoc.data();


        /*
         * Generate custom token
         */
        const customToken =
          await auth.createCustomToken(
              userRecord.uid
            );


        console.log(
          '✅ Custom token generated'
        );


        return res.status(200).json({
          message:
            'Login successful',

          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName:
              userRecord.displayName,
            customToken,
          },

          profile:
            userData || {},
        });

      } catch (firebaseError) {

        console.error(
          '❌ Firebase Error:',
          (firebaseError as any).code,
          (firebaseError as any).message
        );

        if (
          (firebaseError as any).code ===
          'auth/user-not-found'
        ) {

          return res.status(404).json({
            message:
              'User not found. Please sign up first.',
          });
        }

        throw firebaseError;
      }

    } catch (error) {

      console.error(
        '❌ Login Error:',
        error
      );

      return res.status(500).json({
        error:
          getErrorMessage(error),
      });
    }
  }
);


/* =========================================================
   REGISTRATION - VERIFY OTP + CREATE USER
========================================================= */

router.post(
  '/registerWithOTP',
  async (req, res) => {

    try {

      const {
        email,
        password,
        otp,
        fullName,
        phone,
      } = req.body;


      console.log(
        '\n🔄 ==================== REGISTRATION ===================='
      );

      console.log(
        '🔄 Registration attempt for:',
        email
      );


      if (
        !email ||
        !password ||
        !otp
      ) {

        return res.status(400).json({
          message:
            'Email, password, and OTP are required',
        });
      }


      const normalizedEmail =
        email.toLowerCase().trim();


      /*
       * Check if email already exists
       */
      try {

        await auth.getUserByEmail(
            normalizedEmail
          );

        return res.status(400).json({
          message:
            'Email is already registered. Please login instead.',
        });

      } catch (checkError) {

        if (
          (checkError as any).code !==
          'auth/user-not-found'
        ) {

          return res.status(500).json({
            message:
              'Error verifying email. Please try again.',
          });
        }
      }


      /*
       * Get stored OTP
       */
      const cachedData =
        registrationOTPs.get(
          normalizedEmail
        );


      if (!cachedData) {

        return res.status(400).json({
          message:
            'OTP not found. Please request a new OTP.',
        });
      }


      /*
       * Check expiry
       */
      if (
        cachedData.expiry <
        Date.now()
      ) {

        registrationOTPs.delete(
          normalizedEmail
        );

        return res.status(400).json({
          message:
            'OTP has expired. Please request a new one.',
        });
      }


      /*
       * Check OTP
       */
      if (
        cachedData.otp !== otp
      ) {

        return res.status(400).json({
          message:
            'Invalid OTP',
        });
      }


      console.log(
        '✅ Email OTP verified successfully'
      );


      /*
       * Create Firebase user
       */
      let firebaseUser;
      try {
        console.log('🆕 Creating Firebase user...');
        firebaseUser =
          await auth.createUser({
            email: normalizedEmail,
            password,
            displayName:
              fullName ||
              normalizedEmail,
          });
        console.log('✅ Firebase user created:',firebaseUser.uid);
      } catch (firebaseError) {
        console.error(
          '❌ Firebase user creation failed:',
          firebaseError
        );

        if ((firebaseError as any).code ===
          'auth/email-already-exists'
        ) {
          return res.status(400).json({
            message:
              'Email is already registered.',
          });
        }
        if ((firebaseError as any).code ===
          'auth/invalid-password'
        ) {
          return res.status(400).json({
            message:
              'Password is not strong enough.',
          });
        }

        if ((firebaseError as any).code ===
          'auth/invalid-email'
        ) {
          return res.status(400).json({
            message:
              'Invalid email format.',
          });
        }

        throw firebaseError;
      }
      /*
       * Create Firestore document
       */
      try {
        await db
          .collection('users')
          .doc(firebaseUser.uid)
          .set({
            uid:firebaseUser.uid,
            email:firebaseUser.email,
            fullName:fullName || '',
            phone:phone || '',
            displayName:firebaseUser.displayName,
            profileType:
              null,
            createdAt:FieldValue.serverTimestamp(),
            updatedAt:FieldValue.serverTimestamp(),
          });
        console.log(
          '✅ Firestore user document created');
      } catch (firestoreError) {
        console.error(
          '⚠️ Firestore creation error:',
          firestoreError
        );
      }
      /*
       * Delete OTP after successful registration
       */
      registrationOTPs.delete(normalizedEmail);
      /*
       * Generate Firebase custom token
       */
      try {
        const customToken = await auth.createCustomToken(firebaseUser.uid);
        console.log('✅ Custom token generated');

        return res.status(201).json({
          success: true,
          message:
            'Registration Successful',
          user: {
            uid:firebaseUser.uid,
            email:firebaseUser.email,
            displayName:firebaseUser.displayName,
            customToken,
          },
        });

      } catch (tokenError) {
        console.error(
          '⚠️ Failed to generate custom token:',
          tokenError
        );
        return res.status(201).json({
          message:
            'Registration Successful',

          user: {
            uid:firebaseUser.uid,
            email:firebaseUser.email,
            displayName:firebaseUser.displayName,
          },
        });
      }
    } catch (error) {
      console.error('❌ Registration Error:',error);
      return res.status(500).json({
        error:
          getErrorMessage(error),
      });
    }
  }
);
export default router;