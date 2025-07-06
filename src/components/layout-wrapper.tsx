'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Header from '@/components/header'
import { useAuth } from '@/context/auth-context'
import { Dices } from 'lucide-react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  const isAuthPage = pathname === '/'
  const isGameBoard = /^\/play\/[^/]+\/board$/.test(pathname)

  React.useEffect(() => {
    if (loading) {
      return;
    }
    if (user && isAuthPage) {
      router.replace('/dashboard');
    }
    if (!user && !isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, isAuthPage, pathname, router]);

  // While loading or redirecting, show a spinner
  if (loading || (user && isAuthPage) || (!user && !isAuthPage)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Dices className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If on the auth page (and we know user is null), render the children directly
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // If on the game board (and we know user exists), render children directly
  if (isGameBoard) {
    return <>{children}</>;
  }
  
  // Otherwise, it's an authenticated page, so render with header and main layout
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  )
}
