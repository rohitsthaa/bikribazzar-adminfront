import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_PLATFORM_NAME || 'Bikri Bazaar'} — Platform Console`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
