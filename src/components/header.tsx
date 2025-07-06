
'use client';

import Link from 'next/link';
import { Dices, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import type { PlayerCharacter } from '@/lib/types';

const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';

export default function Header() {
  const [hasCharacters, setHasCharacters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
      if (storedCharacters) {
        const playerCharacters: PlayerCharacter[] = JSON.parse(storedCharacters);
        setHasCharacters(playerCharacters.length > 0);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setHasCharacters(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Dices className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Adventure Folio
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm flex-wrap">
          <Link
            href="/play"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Campaigns
          </Link>
          <Link
            href="/classes"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Classes
          </Link>
          <Link
            href="/backgrounds"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Backgrounds
          </Link>
          <Link
            href="/skills"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Skills
          </Link>
          <Link
            href="/features"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Features
          </Link>
          <Link
            href="/items"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Items
          </Link>
          <Link
            href="/spells"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Spells
          </Link>
           <Link
            href="/actions"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Actions
          </Link>
          <Link
            href="/enemies"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Bestiary
          </Link>
           <Link
            href="/narrations"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Narrations
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
           {isClient ? (
              hasCharacters ? (
                <Button asChild>
                  <Link href="/character-sheet">
                    <Users className="mr-2 h-4 w-4" />
                    My Characters
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/character/create">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Character
                  </Link>
                </Button>
              )
           ) : (
            <Button disabled className="w-[150px]">
              <Users className="mr-2 h-4 w-4" />
              My Characters
            </Button>
           )}
        </div>
      </div>
    </header>
  );
}
