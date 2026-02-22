'use client';

import { useEffect, useState, useCallback } from 'react';
import { systemSettingsService } from '@/services/system-settings.service';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export default function MaintenanceBanner() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [message, setMessage] = useState('The system is currently under maintenance. Please try again later.');

  const checkStatus = useCallback(async () => {
    try {
      const status = await systemSettingsService.getSystemStatus();
      setIsMaintenanceMode(!!status?.maintenanceMode);
    } catch {
      // Silently fail — network errors shouldn't show the banner
    }
  }, []);

  useEffect(() => {
    // Listen for 503 events dispatched by the api interceptor
    const handleMaintenanceEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsMaintenanceMode(detail?.active ?? true);
      if (detail?.message) setMessage(detail.message);
    };
    window.addEventListener('asr:maintenance', handleMaintenanceEvent);

    // Initial check + polling
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('asr:maintenance', handleMaintenanceEvent);
      clearInterval(interval);
    };
  }, [checkStatus]);

  if (!isMaintenanceMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
      <span className="text-lg">🔧</span>
      <span className="font-semibold text-sm">{message}</span>
      <button
        onClick={checkStatus}
        className="ml-4 text-xs underline font-semibold hover:text-amber-100 transition-colors"
      >
        Check Again
      </button>
    </div>
  );
}
