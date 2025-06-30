'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Action } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialActions: Action[] = [
  {
    name: "Multiattack",
    type: "Action",
    action_type: "Standard",
    description: "The creature makes two attacks: one with its bite and one with its claws.",
    usage: { type: "per_turn", limit: 1 },
    effects: "Bite: +5 to hit, 1d8+3 piercing. Claws: +5 to hit, 2d6+3 slashing."
  },
  {
    name: "Grapple",
    type: "Action",
    action_type: "Standard",
    description: "You attempt to grapple a creature using a contested Strength (Athletics) check.",
    usage: { type: "at_will" }
  },
];

const STORAGE_KEY = 'dnd_actions';

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    try {
      const storedActions = localStorage.getItem(STORAGE_KEY);
      if (storedActions) {
        setActions(JSON.parse(storedActions));
      } else {
        setActions(initialActions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialActions));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setActions(initialActions);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">ACTIONS</h1>
            <Button asChild>
                <Link href="/actions/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Action
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.name}>
                        <TableCell className="font-medium">{action.name}</TableCell>
                        <TableCell><Badge variant="secondary">{action.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{action.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
