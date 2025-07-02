'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/header'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isGameBoard = /^\/play\/[^/]+\/board$/.test(pathname)

  // On the game board, don't render the header or the standard main container.
  // The GameBoard component will provide its own full-screen layout.
  if (isGameBoard) {
    return <>{children}</>;
  }

  // For all other pages, render the standard layout with header and main container.
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  )
}
