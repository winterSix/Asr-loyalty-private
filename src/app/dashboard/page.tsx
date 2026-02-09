'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';

// Import role-specific dashboards
import CustomerDashboard from '@/components/dashboards/CustomerDashboard';
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

  const renderDashboard = () => {
    switch (role) {
      case 'CUSTOMER':
        return <CustomerDashboard />;
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
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <DashboardLayout role={role}>
      {renderDashboard()}
    </DashboardLayout>
  );
}
