'use client';

import { useState, useEffect, useRef } from 'react';
import { systemSettingsService } from '@/services/system-settings.service';
import toast from 'react-hot-toast';
import { FiShield, FiX, FiMail, FiLoader } from '@/utils/icons';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (otpCode: string) => void;
  title?: string;
  description?: string;
}

export function OtpVerificationModal({
  isOpen,
  onClose,
  onVerified,
  title = 'Verify Your Identity',
  description = 'Enter the 6-digit OTP sent to your email to confirm this action.',
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setIsSending(true);
    try {
      await systemSettingsService.requestToggleOtp();
      setOtpSent(true);
      setCountdown(60);
      toast.success('OTP sent to your email');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    setIsVerifying(true);
    try {
      onVerified(code);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  const otpComplete = otp.every((d) => d !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
            <FiShield className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        </div>

        {!otpSent ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
              <FiMail className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                A 6-digit OTP will be sent to your registered email address. This OTP is valid for 5 minutes.
              </p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={isSending}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP to Email'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Enter the 6-digit code
              </p>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!otpComplete || isVerifying}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm Action'
              )}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Resend OTP in {countdown}s
                </p>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={isSending}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
