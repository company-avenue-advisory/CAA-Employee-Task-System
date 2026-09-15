import '@/styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'CAA Employee Task System',
  description: 'Lightweight internal daily task assignment and task-level EOD reporting system for CAA.',
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
