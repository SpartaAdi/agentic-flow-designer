import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Blueprint — AI Workflow Designer',
  description: 'Design your AI automation workflow in minutes. Get a step-by-step blueprint with platform, LLM, and cost in ₹.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234285F4'/><rect x='6' y='10' width='20' height='3' rx='1.5' fill='white'/><rect x='6' y='16' width='14' height='3' rx='1.5' fill='white' opacity='.8'/><rect x='6' y='22' width='17' height='3' rx='1.5' fill='white' opacity='.65'/><circle cx='27' cy='11.5' r='2.2' fill='white'/><circle cx='21' cy='17.5' r='2.2' fill='white' opacity='.8'/><circle cx='24' cy='23.5' r='2.2' fill='white' opacity='.65'/></svg>" />
        {/* Restore theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('blueprint-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
