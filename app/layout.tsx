import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Blueprint — AI Workflow Designer',
  description: 'Design your AI workflow in minutes. Get a platform recommendation, cost breakdown, and step-by-step build guide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
