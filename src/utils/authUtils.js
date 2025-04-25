import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  applyActionCode
} from 'firebase/auth';

/**
 * Create a new user account with email and password
 * and send verification email
 */
export const signUp = async (email, password) => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    
    return {
      success: true,
      user: userCredential.user,
      message: 'Account created successfully! Please check your email to verify your account.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send password reset email to the user
 */
export const resetPassword = async (email) => {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent! Please check your inbox.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify password reset code and reset password
 */
export const confirmResetPassword = async (code, newPassword) => {
  try {
    const auth = getAuth();
    await confirmPasswordReset(auth, code, newPassword);
    return {
      success: true,
      message: 'Password has been changed successfully. You can now log in with your new password.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify the password reset code
 */
export const verifyPasswordReset = async (code) => {
  try {
    const auth = getAuth();
    const email = await verifyPasswordResetCode(auth, code);
    return {
      success: true,
      email
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send email verification to the current user
 */
export const sendVerificationEmail = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    await sendEmailVerification(user);
    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify email with action code
 */
export const verifyEmail = async (code) => {
  try {
    const auth = getAuth();
    await applyActionCode(auth, code);
    return {
      success: true,
      message: 'Your email has been verified successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Change the user's email address
 * Requires re-authentication first
 */
export const changeEmail = async (currentPassword, newEmail) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update email
    await updateEmail(user, newEmail);
    
    // Send verification email to the new address
    await sendEmailVerification(user);
    
    return {
      success: true,
      message: 'Email changed successfully! Please verify your new email address.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if email is verified
 */
export const isEmailVerified = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return false;
  }
  
  return user.emailVerified;
};

/**
 * Extract action code from URL
 * This utility helps parse Firebase Auth action URLs
 */
export const extractActionCodeFromURL = (url) => {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    return { mode, oobCode };
  } catch (error) {
    return { mode: null, oobCode: null };
  }
}; 