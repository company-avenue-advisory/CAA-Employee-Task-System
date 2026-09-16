import '@/styles/globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'CAA Employee Task System',
  description: 'Lightweight internal daily task assignment and task-level EOD reporting system for CAA.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CAA Tasks',
  },
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#178A4C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
