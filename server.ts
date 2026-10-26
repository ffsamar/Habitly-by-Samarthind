/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store for pending OTP requests
interface StoredOtp {
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

const otpStore = new Map<string, StoredOtp>();

// Helper to hash OTP code
function hashOtp(code: string, salt: string): string {
  return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');
}

// Generate an HTML email for verification code
function generateOtpHtml(code: string, email: string, purpose: string = 'LOGIN'): string {
  const isReset = purpose === 'PASSWORD_RESET';
  const title = isReset ? 'Reset Your Rhythm Password' : 'Your One-Time Passcode';
  const badge = isReset ? 'Password Reset Verification' : 'Security Verification';
  const message = isReset
    ? `We received a request to reset the password for your Rhythm account (<strong>${email}</strong>). Use the one-time code below to verify your identity and set a new password:`
    : `We received a request to log into your Rhythm account using <strong>${email}</strong>. Use the code below to complete your sign-in:`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f7; margin: 0; padding: 24px; color: #2d312e; }
      .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8e0; }
      .logo { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: #1e3a2f; letter-spacing: -0.5px; margin-bottom: 24px; }
      .badge { display: inline-block; padding: 4px 10px; background: ${isReset ? '#fef3c7' : '#e8f5ec'}; color: ${isReset ? '#92400e' : '#2d6a4f'}; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
      h1 { font-size: 22px; font-weight: 700; color: #1a1c1a; margin: 0 0 8px 0; }
      p { font-size: 14px; line-height: 1.6; color: #50554f; margin: 0 0 20px 0; }
      .code-box { background: #f0f4ee; border-radius: 14px; padding: 18px 24px; text-align: center; margin: 24px 0; border: 1px dashed #b5cbbb; }
      .code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a2f; }
      .footer { font-size: 12px; color: #858b83; text-align: center; margin-top: 32px; border-top: 1px solid #edf0eb; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">🌿 Rhythm</div>
      <span class="badge">${badge}</span>
      <h1>${title}</h1>
      <p>Hello,</p>
      <p>${message}</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>

      <p>This code will expire in <strong>10 minutes</strong>. If you did not request this, your account is secure and you can safely ignore this email.</p>

      <div class="footer">
        © ${new Date().getFullYear()} Rhythm • Mindful Daily Momentum<br/>
        Protected by Cryptographic Verification Engine
      </div>
    </div>
  </body>
  </html>
  `;
}

// -----------------------------------------------------------------------------
// Authentication API Endpoints
// -----------------------------------------------------------------------------

// 1. Check Server Dispatch Capabilities & Configuration
app.get('/api/auth/status', (_req: Request, res: Response) => {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  res.json({
    status: 'ok',
    liveEmailEnabled: hasResend || hasSmtp,
    provider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'test_sandbox',
    smtpHost: process.env.SMTP_HOST || 'not_configured',
  });
});

// 2. Request Email OTP
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'A valid email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isReset = purpose === 'PASSWORD_RESET';

    // Check rate limit: 25 seconds between requests
    const existing = otpStore.get(normalizedEmail);
    if (existing && Date.now() - existing.createdAt < 25 * 1000) {
      const waitSeconds = Math.ceil((25 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: `Please wait ${waitSeconds}s before requesting a new code.`,
        waitSeconds,
      });
      return;
    }

    // Generate secure 6-digit random code
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashOtp(otpCode, salt);

    const emailSubject = isReset
      ? `${otpCode} - Reset your Rhythm password`
      : `${otpCode} is your Rhythm security code`;

    // Save with 10-minute validity
    otpStore.set(normalizedEmail, {
      hash,
      salt,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      createdAt: Date.now(),
    });

    // Check dispatch methods
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    // Path A: Resend API
    if (hasResend) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Rhythm Security <onboarding@resend.dev>',
            to: [normalizedEmail],
            subject: emailSubject,
            html: generateOtpHtml(otpCode, normalizedEmail, purpose),
          }),
        });

        if (response.ok) {
          res.json({
            success: true,
            delivered: true,
            provider: 'resend',
            message: `A 6-digit verification code was emailed to ${normalizedEmail}.`,
          });
          return;
        } else {
          console.error('[Resend Error]', await response.text());
        }
      } catch (err) {
        console.error('[Resend Exception]', err);
      }
    }

    // Path B: Real SMTP (e.g. Gmail App Password, SendGrid, Amazon SES)
    if (hasSmtp) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Rhythm Security" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: emailSubject,
          html: generateOtpHtml(otpCode, normalizedEmail, purpose),
        });

        res.json({
          success: true,
          delivered: true,
          provider: 'smtp',
          message: `Verification code sent to ${normalizedEmail}. Check your inbox.`,
        });
        return;
      } catch (err: unknown) {
        console.error('[SMTP Transport Error]', err);
      }
    }

    // Path C: Real Ethereal Email test account (Live Web Inbox)
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await testTransporter.sendMail({
        from: '"Rhythm Security" <security@rhythm.app>',
        to: normalizedEmail,
        subject: emailSubject,
        html: generateOtpHtml(otpCode, normalizedEmail, purpose),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      res.json({
        success: true,
        delivered: false,
        provider: 'ethereal_sandbox',
        message: 'No SMTP credentials configured in server environment yet. Code generated via secure server session.',
        previewUrl: previewUrl || undefined,
        devCode: otpCode, // Provided so the developer is never blocked when testing locally
      });
      return;
    } catch {
      // Direct fallback
      res.json({
        success: true,
        delivered: false,
        provider: 'local_server',
        message: 'Real email delivery requires SMTP_USER & SMTP_PASS in .env. Server generated code below for verification.',
        devCode: otpCode,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: msg });
  }
});

// 3. Verify Email OTP
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'Email and code are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/\D/g, '');

    const record = otpStore.get(normalizedEmail);
    if (!record) {
      res.status(400).json({
        success: false,
        error: 'EXPIRED_OR_NOT_FOUND',
        message: 'No active code found for this email. Please request a new code.',
      });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      res.status(400).json({
        success: false,
        error: 'EXPIRED',
        message: 'This code has expired. Please request a fresh one.',
      });
      return;
    }

    if (record.attempts >= 5) {
      otpStore.delete(normalizedEmail);
      res.status(429).json({
        success: false,
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many incorrect attempts. Please request a new code.',
      });
      return;
    }

    // Hash check
    const calculatedHash = hashOtp(cleanCode, record.salt);
    if (calculatedHash !== record.hash) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
      return;
    }

    // Success - consume OTP
    otpStore.delete(normalizedEmail);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      token: sessionToken,
      email: normalizedEmail,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: msg });
  }
});

// -----------------------------------------------------------------------------
// Real TOTP (RFC 6238 Authenticator App - Google Authenticator / 1Password)
// -----------------------------------------------------------------------------

function generateBase32Secret(length = 20): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += charset[bytes[i] % 32];
  }
  return secret;
}

// RFC 6238 TOTP computation
function computeTotpCode(secretBase32: string, timeStepWindow = 0): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secretBase32.toUpperCase()) {
    const val = charset.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const byteCount = Math.floor(bits.length / 8);
  const keyBytes = Buffer.alloc(byteCount);
  for (let i = 0; i < byteCount; i++) {
    keyBytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepWindow;

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', keyBytes);
  hmac.update(timeBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// 4. Generate Real TOTP Secret & QR Code
app.post('/api/auth/totp/setup', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? String(email).trim() : 'user@rhythm.app';
    const secret = generateBase32Secret(20);

    const otpauthUrl = `otpauth://totp/Rhythm:${encodeURIComponent(cleanEmail)}?secret=${secret}&issuer=Rhythm&digits=6&period=30`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      margin: 1,
      color: {
        dark: '#1e3a2f',
        light: '#ffffff',
      },
      width: 200,
    });

    res.json({
      success: true,
      secret,
      qrCodeDataUrl,
      otpauthUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error generating TOTP';
    res.status(500).json({ success: false, error: msg });
  }
});

// 5. Verify TOTP Code
app.post('/api/auth/totp/verify', (req: Request, res: Response) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) {
      res.status(400).json({ success: false, message: 'Secret and token required' });
      return;
    }

    const cleanToken = String(token).trim().replace(/\D/g, '');

    // Check current step, -1 step, and +1 step (drift tolerance)
    const valid = [-1, 0, 1].some((step) => computeTotpCode(secret, step) === cleanToken);

    if (valid) {
      res.json({ success: true, message: 'Authenticator OTP verified successfully.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid 6-digit Authenticator code. Check your device clock.' });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Verification error';
    res.status(500).json({ success: false, error: msg });
  }
});

// -----------------------------------------------------------------------------
// Vite Dev Server / Production Static Serving
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rhythm Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Rhythm Server] Email dispatch configured: ${Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS))}`);
  });
}

startServer();
