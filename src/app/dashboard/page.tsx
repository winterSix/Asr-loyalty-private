'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';

// Import role-specific dashboards
// import CustomerDashboard from '@/components/dashboards/CustomerDashboard'; // Customers use the mobile app
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import CashierDashboard from '@/components/dashboards/CashierDashboard';
import FinanceManagerDashboard from '@/components/dashboards/FinanceManagerDashboard';
import LoyaltyManagerDashboard from '@/components/dashboards/LoyaltyManagerDashboard';
import CustomerSupportDashboard from '@/components/dashboards/CustomerSupportDashboard';

export default function DashboardPage() {
  const { user, isLoading } = useAuthGuard();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user.role || 'CUSTOMER';

  switch (role) {
    // case 'CUSTOMER':
    //   return <CustomerDashboard />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'CASHIER':
      return <CashierDashboard />;
    case 'FINANCE_MANAGER':
      return <FinanceManagerDashboard />;
    case 'LOYALTY_MANAGER':
      return <LoyaltyManagerDashboard />;
    case 'CUSTOMER_SUPPORT':
      return <CustomerSupportDashboard />;
    case 'CUSTOMER':
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Use the Mobile App</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            The web dashboard is for staff only. Please use the ASR Loyalty mobile app to access your account.
          </p>
        </div>
      );
  }
}
