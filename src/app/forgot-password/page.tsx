'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiArrowLeft,
  FiShield,
  FiCheckCircle,
} from '@/utils/icons';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.forgotPassword(data.email);
      
      setIsSuccess(true);
      toast.success('Password reset code sent to your email!');
      
      // Redirect to reset-password page with email after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-[#0F172A] dark:bg-none flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-[#64748B] mb-6">
              We&apos;ve sent a password reset code to your email address. Please check your inbox and follow the instructions.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-[#64748B]">
                Redirecting to reset password page...
              </p>
              <Link
                href="/login"
                className="text-primary hover:text-primary-light font-semibold transition-colors inline-flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-[#0F172A] dark:bg-none flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-[#64748B]">
            Enter your email address and we&apos;ll send you a code to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm shadow-sm">
            {error}
          </div>
        )}

        <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2.5">
              Email Address
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
            <p className="mt-1.5 text-xs text-gray-500 dark:text-[#64748B]">
              We&apos;ll send a 6-digit code to this email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Sending...
              </span>
            ) : (
              'Send Reset Code'
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

