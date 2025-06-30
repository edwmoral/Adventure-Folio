
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Enemy } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialEnemies: Enemy[] = [
  {
    id: 'goblin-1',
    name: 'Goblin',
    type: 'Humanoid',
    alignment: 'Chaotic Evil',
    challenge_rating: '1/4',
    hit_points: 7,
    mp: 0,
    armor_class: 15,
    speed: '30 ft.',
    str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
    senses: 'Darkvision 60 ft., passive Perception 9',
    languages: 'Common, Goblin',
    traits: 'Nimble Escape: The goblin can take the Disengage or Hide action as a bonus action on each of its turns.',
    actions: 'Scimitar: +4 to hit, 1d6+2 slashing. Shortbow: +4 to hit, range 80/320 ft., 1d6+2 piercing.',
    description: 'A small, black-hearted, evil humanoid that lives in caves and tunnels.',
    tokenImageUrl: 'https://placehold.co/48x48.png',
  },
  {
    id: 'owlbear-1',
    name: 'Owlbear',
    type: 'Monstrosity',
    alignment: 'Unaligned',
    challenge_rating: '3',
    hit_points: 59,
    mp: 0,
    armor_class: 13,
    speed: '40 ft.',
    str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7,
    senses: 'Darkvision 60 ft., passive Perception 13',
    languages: '—',
    traits: 'Keen Sight and Smell: The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.',
    actions: 'Multiattack. The owlbear makes two attacks: one with its beak and one with its claws. Beak. Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage. Claws. Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.',
    description: 'A monstrous predator that combines the features of a giant owl and a bear.',
    tokenImageUrl: 'https://placehold.co/48x48.png',
  },
];

const STORAGE_KEY = 'dnd_enemies';

export default function EnemiesPage() {
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  useEffect(() => {
    try {
      const storedEnemies = localStorage.getItem(STORAGE_KEY);
      if (storedEnemies) {
        setEnemies(JSON.parse(storedEnemies));
      } else {
        setEnemies(initialEnemies);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEnemies));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setEnemies(initialEnemies);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">ENEMIES</h1>
            <Button asChild>
                <Link href="/enemies/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Enemy
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>HP</TableHead>
                        <TableHead>AC</TableHead>
                        <TableHead>CR</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {enemies.map((enemy) => (
                    <TableRow key={enemy.id}>
                        <TableCell className="font-medium">{enemy.name}</TableCell>
                        <TableCell><Badge variant="outline">{enemy.type}</Badge></TableCell>
                        <TableCell>{enemy.hit_points}</TableCell>
                        <TableCell>{enemy.armor_class}</TableCell>
                        <TableCell>{enemy.challenge_rating}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
