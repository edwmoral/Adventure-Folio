
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Monster } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialEnemies: Monster[] = [
  {
    id: 'goblin-1',
    name: 'Goblin',
    type: 'Humanoid',
    alignment: 'Chaotic Evil',
    cr: '1/4',
    hp: '7 (2d6)',
    ac: '15 (Leather Armor, Shield)',
    speed: '30 ft.',
    str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
    senses: 'Darkvision 60 ft., passive Perception 9',
    languages: 'Common, Goblin',
    trait: [{ name: 'Nimble Escape', text: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }],
    action: [{ name: 'Scimitar', text: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' }, { name: 'Shortbow', text: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.' }],
    description: 'A small, black-hearted, evil humanoid that lives in caves and tunnels.',
    tokenImageUrl: 'https://placehold.co/48x48.png',
  },
  {
    id: 'owlbear-1',
    name: 'Owlbear',
    type: 'Monstrosity',
    alignment: 'Unaligned',
    cr: '3',
    hp: '59 (7d10 + 21)',
    ac: '13 (Natural Armor)',
    speed: '40 ft.',
    str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7,
    senses: 'Darkvision 60 ft., passive Perception 13',
    languages: '—',
    trait: [{ name: 'Keen Sight and Smell', text: 'The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.' }],
    action: [{ name: 'Multiattack', text: 'The owlbear makes two attacks: one with its beak and one with its claws.' }, { name: 'Beak', text: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage.' }, { name: 'Claws', text: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.' }],
    description: 'A monstrous predator that combines the features of a giant owl and a bear.',
    tokenImageUrl: 'https://placehold.co/48x48.png',
  },
  {
    id: 'bugbear-1',
    name: 'Bugbear',
    type: 'Humanoid',
    alignment: 'Chaotic Evil',
    cr: '1',
    hp: '27 (5d8 + 5)',
    ac: '16 (Hide Armor, Shield)',
    speed: '30 ft.',
    str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9,
    senses: 'Darkvision 60 ft., passive Perception 10',
    languages: 'Common, Goblin',
    trait: [{ name: 'Brute', text: 'A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack).' }, { name: 'Surprise Attack', text: 'If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage from the attack.' }],
    action: [{ name: 'Morningstar', text: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage.' }, { name: 'Javelin', text: 'Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 9 (2d6 + 2) piercing damage in melee or 5 (1d6 + 2) piercing damage at range.' }],
    description: 'Bugbears are hairy goblinoids who love to bully the weak and dislike being bossed around.',
    tokenImageUrl: 'https://placehold.co/48x48.png',
  },
];

const STORAGE_KEY = 'dnd_enemies';

export default function EnemiesPage() {
  const [enemies, setEnemies] = useState<Monster[]>([]);

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
                        <TableCell>{enemy.hp}</TableCell>
                        <TableCell>{enemy.ac}</TableCell>
                        <TableCell>{enemy.cr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
