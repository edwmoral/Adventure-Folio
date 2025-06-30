'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Item } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialItems: Item[] = [
  {
    name: "Longsword",
    type: "Weapon",
    rarity: "Common",
    weight: 3,
    properties: ["Versatile (1d10)"],
    description: "A standard steel longsword.",
    damage: "1d8",
    damage_type: "Slashing"
  },
  {
    name: "Potion of Healing",
    type: "Consumable",
    rarity: "Common",
    weight: 0.5,
    properties: [],
    description: "You regain 2d4 + 2 hit points when you drink this potion.",
    effect: "Heals 2d4 + 2 HP"
  },
  {
    name: "Cloak of Invisibility",
    type: "Wondrous Item",
    rarity: "Legendary",
    weight: 1,
    properties: [],
    description: "While wearing this cloak, you can turn invisible as an action.",
    effect: "Grants invisibility"
  }
];


export default function ItemsPage() {
    const [items, setItems] = useState<Item[]>(initialItems);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">ITEMS</h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rarity</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                            <Badge variant={item.rarity === 'Legendary' ? 'default' : 'secondary'}>
                                {item.rarity}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
