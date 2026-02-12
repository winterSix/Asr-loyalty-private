'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiShield,
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
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated (but only after checking localStorage, not API)
  useEffect(() => {
    console.log('[Login] Redirect check:', {
      isLoading,
      isAuthenticated,
      authLoading,
      pathname: window.location.pathname
    });
    
    // Don't redirect while we're submitting login
    if (isLoading) {
      console.log('[Login] Skipping redirect - login in progress');
      return;
    }
    
    // Check if we have a stored user/token without calling API
    const storedUser = authService.getUser();
    const hasToken = authService.isAuthenticated();
    
    console.log('[Login] Auth state check:', {
      storedUser: !!storedUser,
      hasToken,
      isAuthenticated,
      authLoading
    });
    
    // Only redirect if we're definitely authenticated (must have actual token)
    if (hasToken && (isAuthenticated || storedUser) && !authLoading) {
      console.log('[Login] User is authenticated, redirecting to /dashboard');
      router.replace('/dashboard');
    } else {
      console.log('[Login] User not authenticated, staying on login page');
    }
  }, [isAuthenticated, authLoading, isLoading, router]);

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
      console.log('[Login] ========== STARTING LOGIN ==========');
      console.log('[Login] Email:', data.email);

      const response = await authService.login(data);
      console.log('[Login] Login API response received (full):', response);
      console.log('[Login] Login API response received (parsed):', {
        hasAccessToken: !!response?.accessToken,
        hasRefreshToken: !!response?.refreshToken,
        hasUser: !!response?.user,
        userRole: response?.user?.role,
        accessTokenPreview: response?.accessToken?.substring(0, 30) + '...' || 'MISSING',
        responseKeys: response ? Object.keys(response) : 'NO RESPONSE'
      });
      
      if (!response.accessToken || !response.refreshToken) {
        throw new Error('Invalid response from server - missing tokens');
      }
      
      // Update auth state
      console.log('[Login] Calling login() in store...');
      login(
        response.accessToken,
        response.refreshToken,
        response.user
      );
      console.log('[Login] Auth state updated in store');

      // Wait a bit for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify token storage
      const storedToken = localStorage.getItem('accessToken');
      const cookieToken = Cookies.get('accessToken');
      const cookieFromDoc = document.cookie.split(';').find(c => c.trim().startsWith('accessToken='));
      
      console.log('[Login] Token storage verification:', {
        localStorage: !!storedToken,
        localStorageLength: storedToken?.length || 0,
        cookieFromJsCookie: !!cookieToken,
        cookieFromDoc: !!cookieFromDoc,
        allCookies: document.cookie
      });

      if (!storedToken) {
        throw new Error('Token not stored in localStorage');
      }

      toast.success('Login successful!');
      console.log('[Login] Toast shown, preparing redirect...');
      
      // Force cookie setting one more time before redirect
      Cookies.set('accessToken', response.accessToken, { 
        expires: 7,
        path: '/',
        sameSite: 'lax',
        secure: false // Set to false for localhost
      });
      Cookies.set('refreshToken', response.refreshToken, { 
        expires: 30,
        path: '/',
        sameSite: 'lax',
        secure: false
      });
      
      console.log('[Login] Cookies set again before redirect');
      console.log('[Login] Final cookie check:', {
        accessToken: Cookies.get('accessToken')?.substring(0, 30) + '...' || 'NOT SET',
        allCookies: document.cookie
      });
      
      // Use window.location.href for full page reload so middleware can see cookies
      console.log('[Login] Redirecting to /dashboard in 500ms...');
      setTimeout(() => {
        console.log('[Login] ========== REDIRECTING NOW ==========');
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      console.error('[Login] Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const highlightItems = [
    'Instant rewards & loyalty points',
    'Secure wallet with OTP protection',
    'Seamless QR payments & transfers',
  ];

  // Don't render login form if already authenticated (will redirect)
  // Must verify actual token exists, not just stale Zustand state
  const storedUser = authService.getUser();
  const hasToken = authService.isAuthenticated();
  if (hasToken && (isAuthenticated || storedUser)) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-stretch">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center gap-8 p-8 lg:p-16 bg-gradient-primary text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="mb-10">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-black text-primary">ASR</span>
                </div>
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
              {highlightItems.map((item, index) => (
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
        <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sign in to continue
              </h2>
              <p className="text-gray-600 text-base">
                Access your dashboard, wallets, and rewards.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    className={`input-field pl-12 h-14 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-primary focus:ring-primary/20'}`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
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
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
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
                disabled={isLoading}
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
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary hover:text-primary-light font-bold transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
