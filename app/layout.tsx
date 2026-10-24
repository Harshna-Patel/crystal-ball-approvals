import React from 'react';
import './globals.css';
export const metadata = {
  title: 'OomniEye · Approvals',
  description: 'Policy-grounded approvals assistant',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
