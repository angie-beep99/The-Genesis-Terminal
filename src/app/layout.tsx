import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Genesis Terminal',
  description: 'Your growth intelligence platform — performance metrics, lead management, and revenue insights.',
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
