'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Spell } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialSpells: Spell[] = [
  {
    name: "Fireball",
    level: 3,
    school: "Evocation",
    time: "1 action",
    range: "150 feet",
    components: "V, S, M (A tiny ball of bat guano and sulfur)",
    duration: "Instantaneous",
    text: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
    classes: "Sorcerer, Wizard",
  },
  {
    name: "Magic Missile",
    level: 1,
    school: "Evocation",
    time: "1 action",
    range: "120 feet",
    components: "V, S",
    duration: "Instantaneous",
    text: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
    classes: "Sorcerer, Wizard",
  }
];

const STORAGE_KEY = 'dnd_spells';

export default function SpellsPage() {
  const [spells, setSpells] = useState<Spell[]>([]);

  useEffect(() => {
    try {
      const storedSpells = localStorage.getItem(STORAGE_KEY);
      if (storedSpells) {
        setSpells(JSON.parse(storedSpells));
      } else {
        setSpells(initialSpells);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSpells));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setSpells(initialSpells);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">SPELLS</h1>
            <Button asChild>
                <Link href="/spells/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Spell
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Casting Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {spells.map((spell) => (
                    <TableRow key={spell.name}>
                        <TableCell className="font-medium">{spell.name}</TableCell>
                        <TableCell>{spell.level === 0 ? "Cantrip" : spell.level}</TableCell>
                        <TableCell><Badge variant="outline">{spell.school}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{spell.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
