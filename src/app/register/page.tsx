'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiPhone,
  FiMail,
  FiLock,
  FiKey,
  FiCheckCircle,
  FiShield,
} from '@/utils/icons';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number').optional().or(z.literal('')),
  email: z.string().email('Please provide a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
  referralCode: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const registerData = {
        ...data,
        phoneNumber: data.phoneNumber || undefined,
        referralCode: data.referralCode || undefined,
      };

      await authService.register(registerData);

      toast.success('Registration successful! Please check your email for verification code.');
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.googleLogin(idToken);
      // Tokens are set as httpOnly cookies by the Next.js proxy route
      login('', '', response.user);
      toast.success('Signed in with Google!');
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
    'Earn loyalty points on every transaction',
    'Instant wallet funding with secure OTP',
    'Invite friends and unlock referral perks',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-[#0F172A] flex items-stretch">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center gap-8 p-8 lg:p-16 bg-gradient-primary text-white relative overflow-hidden">
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
                Create your wallet, unlock rewards.
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Join the ASR loyalty network and start earning from day one—secure payments, smart savings, and benefits tailored to you.
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

        {/* Right Side - Register Form */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-[#1E293B] transition-colors duration-300">
          <div className="w-full max-w-lg">
            <div className="mb-10">
              <div className="flex justify-center mb-6 lg:hidden">
                <Image src="/logo.svg" alt="ASR Loyalty" width={64} height={64} className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">
                Sign up and get started
              </h2>
              <p className="text-gray-600 dark:text-[#64748B] text-base">
                Create your account to manage wallets, payments, and rewards.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`input-field pl-12 h-14 ${errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                      placeholder="First name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`input-field pl-12 h-14 ${errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                      placeholder="Last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field pl-12 h-14 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-500 dark:text-[#64748B]">We&apos;ll send a verification code to this email</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    className={`input-field pl-12 h-14 ${errors.phoneNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="+234XXXXXXXXXX or 0XXXXXXXXXX"
                  />
                </div>
                {errors.phoneNumber ? (
                  <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-[#64748B]">Format: +234XXXXXXXXXX or 0XXXXXXXXXX</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className={`input-field pl-12 h-14 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="Create a strong password"
                  />
                </div>
                {errors.password ? (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-[#64748B]">Must contain uppercase, lowercase and number</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
                  Referral Code <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiKey className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register('referralCode')}
                    type="text"
                    className={`input-field pl-12 h-14 ${errors.referralCode ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="Enter referral code"
                  />
                </div>
                {errors.referralCode && (
                  <p className="mt-2 text-sm text-red-600">{errors.referralCode.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-8 h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 dark:text-[#64748B]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:text-primary-light font-bold transition-colors">
                    Sign in
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
              {/* Visual layer */}
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
              {/* Functional layer */}
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

          </div>
        </div>
      </div>
    </div>
  );
}
