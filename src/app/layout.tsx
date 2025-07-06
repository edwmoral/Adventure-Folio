import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'Adventure Folio',
  description: 'Your D&D character manager',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
