
'use client';

import Link from 'next/link';
import {
  Dices,
  User,
  ChevronDown,
  LogOut,
  UserPlus,
  Users,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const navLinks = [
  { href: '/play', label: 'Campaigns' },
  { href: '/classes', label: 'Classes' },
  { href: '/backgrounds', label: 'Backgrounds' },
  { href: '/skills', label: 'Skills' },
  { href: '/features', label: 'Features' },
  { href: '/items', label: 'Items' },
  { href: '/spells', label: 'Spells' },
  { href: '/actions', label: 'Actions' },
  { href: '/enemies', label: 'Bestiary' },
  { href: '/narrations', label: 'Narrations' },
];

export default function Header() {
  const { toast } = useToast();
  const { user, isFirebaseConfigured } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase is not configured correctly.',
      });
      return;
    }
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      // Redirect is handled by the LayoutWrapper
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out.',
      });
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <Dices className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Adventure Folio
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="link"
              className="text-foreground/60 hover:text-foreground/80 hover:no-underline px-3"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">More pages</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {isClient && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">
                    {user.displayName || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/character-sheet">
                    <Users className="mr-2 h-4 w-4" />
                    <span>My Characters</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/character/create">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>New Character</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Skeleton className="h-8 w-24" />
          )}
        </div>
      </div>
    </header>
  );
}
