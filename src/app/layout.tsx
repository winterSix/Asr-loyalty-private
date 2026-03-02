import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const Toaster = dynamic(
  () => import('react-hot-toast').then((mod) => mod.Toaster),
  { ssr: false }
);

const MaintenanceBanner = dynamic(
  () => import('@/components/MaintenanceBanner'),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ASR Loyalty',
  description: 'Digital Wallet & Loyalty Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <QueryProvider>
            <MaintenanceBanner />
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
