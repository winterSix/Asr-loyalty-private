'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiShield,
  FiAlertTriangle,
  FiArrowLeft,
} from '@/utils/icons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationAlert, setVerificationAlert] = useState<'email' | 'phone' | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Use relative /api proxy to avoid exposing backend URL to client and to keep CORS simple
    fetch('/api/system-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.maintenanceMode === true) setIsMaintenanceMode(true);
      })
      .catch(() => {});
  }, []);

  // Redirect if already authenticated (but only after checking localStorage, not API)
  useEffect(() => {
    if (!mounted) return;

    // Don't redirect while we're submitting login
    if (isLoading) return;

    // Check if we have a stored user/token without calling API
    const storedUser = authService.getUser();
    const hasToken = authService.isAuthenticated();

    // Only redirect if we're definitely authenticated (must have actual token)
    if (hasToken && (isAuthenticated || storedUser) && !authLoading) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, isLoading, router, mounted]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(data);

      // 2FA required — switch to code entry view
      if (response.requiresTwoFactor) {
        setTwoFactorPending(true);
        setTwoFactorEmail(response.email || data.email);
        setIsLoading(false);
        return;
      }

      // Tokens are set as httpOnly cookies by the Next.js proxy route
      login('', '', response.user);
      toast.success('Login successful!');
      const mustChange = response.mustChangePassword ?? response.user?.mustChangePassword;
      setTimeout(() => { window.location.href = mustChange ? '/force-change-password' : '/dashboard'; }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';

      if (errorMessage === 'Please verify your email first') {
        setVerificationAlert('email');
        setPendingEmail(data.email);
        setError(null);
      } else if (errorMessage === 'Please verify your phone number first') {
        setVerificationAlert('phone');
        setError(null);
      } else {
        // Normalize suspended/inactive message
        const lowerMsg = errorMessage.toLowerCase();
        const displayMessage =
          lowerMsg.includes('suspend')
            ? 'Account suspended. Please contact admin.'
            : lowerMsg.includes('inactive') || lowerMsg.includes('deactivat')
            ? 'Account deactivated. Please contact admin.'
            : errorMessage;
        setError(displayMessage);
        toast.error(displayMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!twoFactorCode.trim()) return;
    try {
      setTwoFactorLoading(true);
      setError(null);
      const response = await authService.verify2FA(twoFactorEmail, twoFactorCode.trim());
      // Tokens are set as httpOnly cookies by the Next.js proxy route
      login('', '', response.user);
      toast.success('Login successful!');
      const mustChange = response.mustChangePassword ?? response.user?.mustChangePassword;
      setTimeout(() => { window.location.href = mustChange ? '/force-change-password' : '/dashboard'; }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid verification code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.googleLogin(idToken);
      // Tokens are set as httpOnly cookies by the Next.js proxy route
      login('', '', response.user);
      toast.success('Login successful!');
      const mustChange = response.mustChangePassword ?? response.user?.mustChangePassword;
      setTimeout(() => { window.location.href = mustChange ? '/force-change-password' : '/dashboard'; }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const highlightItems = [
    'Instant rewards & loyalty points',
    'Secure wallet with OTP protection',
    'Seamless QR payments & transfers',
  ];

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:bg-[#0F172A] dark:from-[#0F172A] dark:via-[#0F172A] dark:to-[#0F172A] flex items-stretch transition-colors duration-300">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center gap-8 p-8 lg:p-16 bg-gradient-primary text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>

          <div className="relative z-10">
            <div className="mb-10">
              <div className="mb-6">
                <Image src="/logo.svg" alt="ASR Loyalty" width={80} height={80} className="w-20 h-20 object-contain" />
              </div>
              <h1 className="text-5xl font-black uppercase tracking-wider text-white drop-shadow-2xl mb-3">
                ASR Loyalty
              </h1>
              <p className="text-white/80 text-lg font-medium">Rewards that matter</p>
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-4 text-white leading-tight">
                Welcome back to rewards that grow with you.
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Manage your digital wallet, earn loyalty points on every spend, and unlock exclusive perks across our partner ecosystem.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {highlightItems.map((item) => (
                <div key={item} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all">
                    <FiCheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white text-lg font-medium">{item}</p>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg">
              <FiShield className="w-5 h-5" />
              <p className="font-semibold">Bank-grade security. Always on.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-[#1E293B] transition-colors duration-300">
          <div className="w-full max-w-md">

            {/* ── 2FA Step ── */}
            {twoFactorPending ? (
              <div>
                <button
                  onClick={() => { setTwoFactorPending(false); setTwoFactorCode(''); setError(null); }}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#64748B] hover:text-gray-700 dark:hover:text-[#c9d1e5] mb-8 transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back to login
                </button>
                <div className="mb-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <FiShield className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">Two-Factor Verification</h2>
                  <p className="text-gray-600 dark:text-[#64748B] text-base">
                    Enter the 6-digit code sent to <span className="font-semibold text-gray-800 dark:text-[#CBD5E1]">{twoFactorEmail}</span>
                  </p>
                </div>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm shadow-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className="input-field h-14 text-center text-2xl font-bold tracking-[0.5em] focus:border-primary focus:ring-primary/20"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handle2FASubmit}
                    disabled={twoFactorLoading || twoFactorCode.length < 6}
                    className="btn-primary w-full h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {twoFactorLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Verifying...
                      </span>
                    ) : 'Verify & Sign In'}
                  </button>
                </div>
              </div>
            ) : (
            <>
            <div className="mb-10">
              <div className="flex justify-center mb-6 lg:hidden">
                <Image src="/logo.svg" alt="ASR Loyalty" width={64} height={64} className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">
                Sign in to continue
              </h2>
              <p className="text-gray-600 dark:text-[#64748B] text-base">
                Access your dashboard, wallets, and rewards.
              </p>
            </div>

            {isMaintenanceMode && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 shadow-sm">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-400 text-sm">System Under Maintenance</p>
                    <p className="text-amber-700 dark:text-amber-500 text-sm mt-0.5">
                      The system is currently undergoing maintenance. Only administrators can sign in at this time. Please check back later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm shadow-sm">
                {error}
              </div>
            )}

            {verificationAlert === 'email' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-400 text-sm shadow-sm">
                <p className="font-semibold mb-1">Email verification required</p>
                <p className="text-amber-700 dark:text-amber-500 mb-3">Your email address has not been verified. Please check your inbox for the verification code.</p>
                <a
                  href={`/verify-otp?email=${encodeURIComponent(pendingEmail)}`}
                  className="inline-block px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                >
                  Enter verification code
                </a>
              </div>
            )}

            {verificationAlert === 'phone' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-400 text-sm shadow-sm">
                <p className="font-semibold mb-1">Phone verification required</p>
                <p className="text-amber-700 dark:text-amber-500">Your phone number must be verified before you can sign in. Please verify it from your mobile app profile, or contact support.</p>
              </div>
            )}

            <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="w-5 h-5 text-gray-400 dark:text-[#64748B]" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field pl-12 h-14 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400 dark:text-[#64748B]" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-12 pr-12 h-14 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-[#64748B] hover:text-gray-600 dark:hover:text-[#a8b4cc] transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary-light font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || isMaintenanceMode}
                className="btn-primary w-full mt-6 h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 dark:text-[#64748B]">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary hover:text-primary-light font-bold transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>

            {/* Google OAuth */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-[#1E293B] text-gray-500 dark:text-[#64748B] font-medium">or continue with</span>
              </div>
            </div>

            <div className="w-full relative">
              {/* Visual layer — custom button matching mobile design */}
              <div className="google-animated-btn w-full pointer-events-none" aria-hidden="true">
                <div className="google-inner-bg flex items-center justify-center gap-3 py-[14px] px-6">
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.991 21.991 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: '#111827' }}>Continue with Google</span>
                </div>
              </div>
              {/* Functional layer — invisible GoogleLogin button on top, handles actual auth */}
              <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ opacity: 0.001 }}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      handleGoogleLogin(credentialResponse.credential);
                    }
                  }}
                  onError={() => toast.error('Google sign-in failed. Please try again.')}
                  useOneTap={false}
                  width="800"
                  size="large"
                />
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
}
