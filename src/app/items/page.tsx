'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Item } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialItems: Item[] = [
  {
    name: "Longsword",
    type: "Weapon",
    weight: 3,
    property: ["Versatile (1d10)"],
    text: "A standard steel longsword.",
    dmg1: "1d8",
    dmgType: "Slashing"
  },
  {
    name: "Potion of Healing",
    type: "Consumable",
    weight: 0.5,
    text: "A character who drinks the magical red fluid in this vial regains 2d4 + 2 hit points.",
    detail: "Heals 2d4 + 2 HP"
  },
  {
    name: "Cloak of Invisibility",
    type: "Wondrous Item",
    magic: true,
    weight: 1,
    text: "While wearing this cloak, you can pull its hood over your head to become invisible. While you are invisible, anything you are carrying or wearing is invisible with you. You remain invisible until you pull the hood back, or until something causes you to become visible.",
    detail: "Grants invisibility"
  }
];

const STORAGE_KEY = 'dnd_items';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        setItems(initialItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialItems));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setItems(initialItems);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">ITEMS</h1>
            <Button asChild>
                <Link href="/items/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}{item.magic && ' ✨'}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.weight || 0} lb.</TableCell>
                        <TableCell className="text-muted-foreground">{item.text}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
