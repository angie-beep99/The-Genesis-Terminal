import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Genesis Terminal',
  description: 'Your marketing performance at a glance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-genesis-bg text-genesis-text antialiased">
        {children}
      </body>
    </html>
  );
}
