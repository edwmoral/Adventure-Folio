'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Feat } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialFeats: Feat[] = [
  {
    name: "Sharpshooter",
    prerequisites: ["Proficiency with ranged weapons"],
    description: "You can make attacks at long range without disadvantage, and your ranged attacks ignore half and three-quarters cover. Before you make an attack, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage.",
    effects: [
      "Ignore cover",
      "+10 damage at -5 accuracy",
      "No disadvantage at long range"
    ]
  },
  {
    name: "Tough",
    prerequisites: [],
    description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.",
    effects: [
      "+2 HP per level"
    ]
  },
  {
    name: "Great Weapon Master",
    prerequisites: ["Proficiency with a melee weapon"],
    description: "On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to a he attack roll. If the attack hits, you add +10 to the attack's damage.",
    effects: [
      "Bonus action attack on critical or kill",
      "+10 damage at -5 accuracy with heavy weapons"
    ]
  }
];

const STORAGE_KEY = 'dnd_feats';

export default function FeaturesPage() {
  const [feats, setFeats] = useState<Feat[]>([]);

  useEffect(() => {
    try {
      const storedFeats = localStorage.getItem(STORAGE_KEY);
      if (storedFeats) {
        setFeats(JSON.parse(storedFeats));
      } else {
        setFeats(initialFeats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFeats));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setFeats(initialFeats);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">FEATS</h1>
             <Button asChild>
                <Link href="/features/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Feat
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Prerequisites</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feats.map(feat => (
                    <TableRow key={feat.name}>
                        <TableCell className="font-medium">{feat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{feat.prerequisites.join(', ') || 'None'}</TableCell>
                        <TableCell className="text-muted-foreground">{feat.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
