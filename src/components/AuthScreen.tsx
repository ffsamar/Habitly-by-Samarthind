import React, { useState, useEffect, useRef } from 'react';
import { UserAccount } from '../types';
import { APP_ASSETS } from '../mockData';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthScreenProps {
  onLogin: (user: UserAccount) => void;
  onGuestLogin: () => void;
  savedAccounts: UserAccount[];
}

type AuthMode = 'email_otp' | 'authenticator_totp';
type AuthStep =
  | 'entry'
  | 'otp_verify'
  | 'profile_setup'
  | 'password_entry'
  | 'forgot_password_entry'
  | 'reset_password_new';

interface ServerStatus {
  liveEmailEnabled: boolean;
  provider: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onGuestLogin,
  savedAccounts,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('email_otp');
  const [step, setStep] = useState<AuthStep>('entry');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dailyBudget, setDailyBudget] = useState('60');

  // Password Login & Reset states
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetFlow, setIsResetFlow] = useState(false);

  // Server state & OTP
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState<{
    delivered: boolean;
    provider: string;
    message: string;
    previewUrl?: string;
    devCode?: string;
  } | null>(null);

  // OTP Digits & Resend
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(30);

  // TOTP State
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpQrCode, setTotpQrCode] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch backend status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          liveEmailEnabled: data.liveEmailEnabled,
          provider: data.provider,
        });
      })
      .catch(() => {
        setServerStatus({ liveEmailEnabled: false, provider: 'local' });
      });
  }, []);

  // Resend countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp_verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Request Email OTP (for Login or Password Reset)
  const handleRequestEmailOtp = async (purpose: 'LOGIN' | 'PASSWORD_RESET' = 'LOGIN') => {
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      setDeliveryInfo({
        delivered: data.delivered,
        provider: data.provider,
        message: data.message,
        previewUrl: data.previewUrl,
        devCode: data.devCode,
      });

      setIsResetFlow(purpose === 'PASSWORD_RESET');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(data.waitSeconds || 30);
      setStep('otp_verify');

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setError('Unable to reach server. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup TOTP (Authenticator App)
  const handleSetupTotp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim() || 'user@rhythm.app';
      const res = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to initialize TOTP');
        return;
      }
      setIsResetFlow(false);
      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCodeDataUrl);
      setStep('otp_verify');
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setError('Failed to setup authenticator app.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP via Backend
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      if (authMode === 'authenticator_totp') {
        const res = await fetch('/api/auth/totp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: totpSecret, token: code }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Invalid code from authenticator app. Check device clock.');
          setIsVerifying(false);
          return;
        }
      } else {
        const cleanEmail = email.trim().toLowerCase();
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, code }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Incorrect verification code.');
          setIsVerifying(false);
          return;
        }
      }

      // If this was a password reset flow, proceed to setting the new password!
      if (isResetFlow) {
        setIsVerifying(false);
        setStep('reset_password_new');
        return;
      }

      // Normal Login flow
      const cleanEmail = email.trim().toLowerCase() || 'user@rhythm.app';
      const existing = savedAccounts.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        onLogin(existing);
      } else {
        setName(cleanEmail.split('@')[0]);
        setStep('profile_setup');
      }
    } catch {
      setError('Network error while verifying code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Saving New Password after OTP verification
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = savedAccounts.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      const updatedUser: UserAccount = {
        ...existing,
        password: newPassword,
      };
      setSuccessMessage('Password successfully updated! Signing you in...');
      setTimeout(() => onLogin(updatedUser), 600);
    } else {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: newPassword,
        dailyBudget: 60.0,
        streakDays: 1,
        joinedDate: 'Today',
        avatarUrl: APP_ASSETS.profile,
      };
      setSuccessMessage('Password set! Creating and opening your account...');
      setTimeout(() => onLogin(newUser), 600);
    }
  };

  // Handle Standard Password Login
  const handlePasswordSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    const existing = savedAccounts.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      setError('No account found with this email. Use Email OTP to sign in or register.');
      return;
    }

    if (!existing.password) {
      setError('This account does not have a password yet. Please reset it with Email OTP.');
      return;
    }

    if (existing.password !== password) {
      setError('Incorrect password. Click "Forgot password?" below if you cannot remember it.');
      return;
    }

    onLogin(existing);
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide your name.');
      return;
    }

    const budgetNum = parseFloat(dailyBudget);
    const cleanEmail = email.trim().toLowerCase() || `${cleanName.toLowerCase()}@rhythm.app`;

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      dailyBudget: !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : 60.0,
      streakDays: 1,
      joinedDate: 'Today',
      avatarUrl: APP_ASSETS.profile,
    };

    onLogin(newUser);
  };

  const copySecretToClipboard = () => {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8 font-sans antialiased text-on-surface relative">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_32px_rgba(25,28,30,0.06)] border border-surface-container/60 space-y-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <img
            src={APP_ASSETS.logo}
            alt="Rhythm"
            className="w-12 h-12 rounded-2xl object-contain shadow-xs"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Rhythm</h1>
          <p className="text-xs text-on-surface-variant font-medium">
            Mindful Daily Momentum • Real Security
          </p>

          {/* Real Backend Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-[11px] font-semibold text-on-surface-variant mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus?.liveEmailEnabled ? 'bg-secondary animate-pulse' : 'bg-primary'
              }`}
            />
            <span>
              {serverStatus?.liveEmailEnabled
                ? 'Live SMTP Dispatch Active'
                : 'Cryptographic OTP & TOTP Engine'}
            </span>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-secondary-container/60 text-secondary text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-error-container/60 text-error text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Main Entry (Email OTP vs Authenticator TOTP) */}
        {step === 'entry' && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant">
              <button
                type="button"
                onClick={() => setAuthMode('email_otp')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'email_otp'
                    ? 'bg-white text-on-surface shadow-xs'
                    : 'hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('authenticator_totp')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'authenticator_totp'
                    ? 'bg-white text-on-surface shadow-xs'
                    : 'hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span>Authenticator</span>
              </button>
            </div>

            {authMode === 'email_otp' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestEmailOtp('LOGIN');
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden transition-all"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                    <span className="absolute right-3 top-3 material-symbols-outlined text-on-surface-variant text-[18px]">
                      mail
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    A genuine 6-digit cryptographic verification code will be generated and sent to your address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Dispatching OTP...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Send 6-Digit Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Account Email or Identifier
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Works directly with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong> (RFC 6238 TOTP).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSetupTotp}
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Setting up Authenticator...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">qr_code</span>
                      <span>Generate QR Code &amp; Connect</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Links: Sign in with password / Forgot password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('password_entry');
                  setError(null);
                }}
                className="text-on-surface-variant hover:text-on-surface font-semibold hover:underline cursor-pointer"
              >
                Sign in with password
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('forgot_password_entry');
                  setError(null);
                }}
                className="text-secondary hover:text-emerald-700 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                <span>Forgot password?</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Password Login Screen */}
        {step === 'password_entry' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-3.5">
            <div className="text-center">
              <h2 className="text-base font-bold text-on-surface">Password Sign In</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Enter your credentials to access your Rhythm account
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-secondary font-semibold hover:underline cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('forgot_password_entry');
                  setError(null);
                }}
                className="text-secondary font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">key</span>
                <span>Forgot password? Reset via Email</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('entry');
                setError(null);
              }}
              className="w-full text-center text-xs text-on-surface-variant hover:text-on-surface font-semibold hover:underline cursor-pointer pt-1"
            >
              Back to Email OTP / Authenticator
            </button>
          </form>
        )}

        {/* STEP: Forgot Password Entry (Email Only Request) */}
        {step === 'forgot_password_entry' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRequestEmailOtp('PASSWORD_RESET');
            }}
            className="space-y-3.5"
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-700 mx-auto flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              </div>
              <h2 className="text-base font-bold text-on-surface">Reset Your Password</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                We will email you a secure One-Time Passcode to verify your identity and set a new password.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Your Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                  autoFocus
                  required
                />
                <span className="absolute right-3 top-3 material-symbols-outlined text-on-surface-variant text-[18px]">
                  mail
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Sending Reset Code...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Send Password Reset OTP</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('entry');
                setError(null);
              }}
              className="w-full text-center text-xs text-on-surface-variant hover:text-on-surface font-semibold hover:underline cursor-pointer pt-1"
            >
              Cancel &amp; return to sign in
            </button>
          </form>
        )}

        {/* STEP: OTP Verification Screen */}
        {step === 'otp_verify' && (
          <div className="space-y-4">
            {authMode === 'authenticator_totp' ? (
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-base font-bold text-on-surface">Scan with Authenticator App</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Open Google Authenticator or your password manager
                  </p>
                </div>

                {/* Real QR Code */}
                {totpQrCode && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-surface-container w-fit mx-auto shadow-xs">
                    <img
                      src={totpQrCode}
                      alt="Authenticator QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                    <span className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Scan in Google Authenticator
                    </span>
                  </div>
                )}

                {/* Manual Secret Key */}
                <div className="p-2.5 bg-surface-container-low rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Or Enter Key Manually
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xs font-mono font-bold tracking-widest text-on-surface bg-white px-2 py-0.5 rounded border border-surface-container">
                      {totpSecret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecretToClipboard}
                      className="text-xs text-secondary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedSecret ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-center">
                  <div
                    className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-1.5 ${
                      isResetFlow
                        ? 'bg-amber-500/15 text-amber-700'
                        : 'bg-secondary-container/40 text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isResetFlow ? 'lock_reset' : 'mark_email_read'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-on-surface">
                    {isResetFlow ? 'Reset Code Verification' : 'Enter 6-Digit Code'}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Sent to <strong className="text-on-surface">{email}</strong>
                  </p>
                </div>

                {/* Real Delivery Notification Box */}
                {deliveryInfo && (
                  <div
                    className={`p-3 rounded-2xl text-xs space-y-1.5 border ${
                      deliveryInfo.delivered
                        ? 'bg-secondary-container/30 border-secondary/30 text-on-secondary-container'
                        : 'bg-surface-container-low border-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[16px]">
                        {deliveryInfo.delivered ? 'send' : 'info'}
                      </span>
                      <span>
                        {deliveryInfo.delivered
                          ? 'Email Dispatched via SMTP'
                          : 'Server Code Generated'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {deliveryInfo.delivered
                        ? 'Please check your email inbox (and Spam/Junk folder) for the 6-digit passcode.'
                        : 'To send directly to your actual inbox, configure SMTP credentials in server .env. For instant testing:'}
                    </p>

                    {/* If Ethereal webmail test inbox exists */}
                    {deliveryInfo.previewUrl && (
                      <a
                        href={deliveryInfo.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-surface-container text-[11px] font-bold text-secondary hover:bg-neutral-50 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        <span>View Real Ethereal Webmail Inbox ↗</span>
                      </a>
                    )}

                    {/* Dev code helper when no SMTP is configured */}
                    {deliveryInfo.devCode && (
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-surface-container mt-1">
                        <span className="text-[11px] text-on-surface-variant">Server Code:</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-sm tracking-widest text-primary font-bold">
                            {deliveryInfo.devCode}
                          </strong>
                          <button
                            type="button"
                            onClick={() => {
                              const code = deliveryInfo.devCode!;
                              setOtpDigits(code.split(''));
                              handleVerifyOtp(code);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-on-secondary hover:bg-emerald-600 cursor-pointer"
                          >
                            Fill &amp; Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6-Digit Segmented PIN Inputs */}
            <div className="flex items-center justify-between gap-1.5 py-1">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden transition-all tabular-nums shadow-2xs"
                />
              ))}
            </div>

            {/* Resend / Back actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              {authMode === 'email_otp' ? (
                <button
                  type="button"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={() => handleRequestEmailOtp(isResetFlow ? 'PASSWORD_RESET' : 'LOGIN')}
                  className={`font-semibold cursor-pointer ${
                    resendTimer > 0 || isLoading
                      ? 'text-on-surface-variant/50 cursor-not-allowed'
                      : 'text-secondary hover:underline'
                  }`}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              ) : (
                <span className="text-[11px] text-on-surface-variant">
                  Code refreshes every 30s
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep('entry');
                  setError(null);
                }}
                className="text-on-surface-variant hover:text-on-surface font-semibold hover:underline cursor-pointer"
              >
                Change method
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={otpDigits.join('').length < 6 || isVerifying}
              onClick={() => handleVerifyOtp()}
              className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                otpDigits.join('').length === 6 && !isVerifying
                  ? 'bg-primary text-on-primary hover:bg-neutral-800 active:scale-[0.98]'
                  : 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {isResetFlow ? 'lock_open' : 'verified_user'}
                  </span>
                  <span>{isResetFlow ? 'Verify & Reset Password' : 'Verify & Continue'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP: New Password Setup (after OTP verification in reset flow) */}
        {step === 'reset_password_new' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
            <div className="text-center">
              <span className="w-10 h-10 rounded-full bg-secondary-container/50 text-secondary mx-auto flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <h2 className="text-base font-bold text-on-surface">Set New Password</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Identity verified for <strong className="text-on-surface">{email}</strong>. Enter your new password below:
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                autoFocus
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Confirm New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-secondary font-semibold hover:underline cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer mt-1 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Save New Password &amp; Sign In</span>
            </button>
          </form>
        )}

        {/* STEP: Profile Setup for First-Time Users */}
        {step === 'profile_setup' && (
          <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
            <div className="text-center">
              <span className="w-10 h-10 rounded-full bg-secondary-container/50 text-secondary mx-auto flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </span>
              <h2 className="text-base font-bold text-on-surface">Welcome to Rhythm!</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                OTP verified successfully. Complete your profile:
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Daily Spend Limit ($)
              </label>
              <input
                type="number"
                placeholder="60.00"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden tabular-nums font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer mt-1"
            >
              Start My Rhythm Journey
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="border-t border-surface-container w-full" />
          <span className="bg-surface-container-lowest px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider absolute">
            Or
          </span>
        </div>

        {/* Guest Access Option */}
        <button
          type="button"
          onClick={onGuestLogin}
          className="w-full py-2 px-3 rounded-full border border-secondary text-secondary hover:bg-secondary-container/30 text-xs font-bold active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          <span>Continue as Guest (Instant Access)</span>
        </button>

        {/* Android PWA Install Button (100% Free) */}
        <div className="pt-0.5 flex justify-center">
          <PWAInstallButton variant="banner" className="w-full" />
        </div>

        {/* Existing Accounts Quick Switcher (if any saved) */}
        {savedAccounts.length > 0 && (
          <div className="pt-0.5 text-center">
            <span className="text-[10px] font-semibold text-on-surface-variant block mb-1">
              Saved profiles on this device:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {savedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onLogin(acc)}
                  className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-medium text-on-surface flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
