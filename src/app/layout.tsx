import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'UP Police AI Complaint Intelligence Dashboard',
  description: 'AI-Powered case classification, severity prediction, threat diagnostics, and natural language database query analytics for UP Police command centers.',
  keywords: ['UP Police', 'Complaint Intelligence', 'AI Police Command', 'Case Management', 'AI Text-to-SQL'],
  authors: [{ name: 'UP Police Tech Division' }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-[#050814] text-[#f1f5f9] h-full antialiased font-sans flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
