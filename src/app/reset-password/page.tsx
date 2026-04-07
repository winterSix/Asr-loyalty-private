'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiKey,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheckCircle,
} from '@/utils/icons';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(6, 'OTP code must be 6 digits').max(6, 'OTP code must be 6 digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const emailFromQuery = searchParams?.get('email') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromQuery,
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery);
    }
  }, [emailFromQuery, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.resetPassword(data.email, data.code, data.newPassword);
      
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const email = emailFromQuery || '';
    if (!email) {
      toast.error('Email is required');
      return;
    }

    try {
      await authService.forgotPassword(email);
      toast.success('Reset code resent successfully! Check your email.');
      setCountdown(60);
      
      // Countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend code. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <Link
              href="/login"
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter the code sent to your email and create a new password.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm shadow-sm">
            {error}
          </div>
        )}

        <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                disabled={!!emailFromQuery}
                className={`input-field pl-12 h-14 ${emailFromQuery ? 'bg-gray-50' : ''} ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiKey className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('code')}
                type="text"
                maxLength={6}
                className={`input-field pl-12 h-14 text-center text-2xl font-mono tracking-widest ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                placeholder="000000"
              />
            </div>
            {errors.code && (
              <p className="mt-2 text-sm text-red-600">{errors.code.message}</p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Check your email inbox for the 6-digit code
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0}
                className="text-xs text-primary hover:text-primary-light font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                className={`input-field pl-12 pr-12 h-14 ${errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              Must contain uppercase, lowercase and number
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input-field pl-12 pr-12 h-14 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-primary hover:text-primary-light font-semibold transition-colors inline-flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}



