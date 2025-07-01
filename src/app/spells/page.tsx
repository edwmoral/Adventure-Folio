
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Spell } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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
    aoe: { shape: 'sphere', size: 20 },
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
  const [spellToDelete, setSpellToDelete] = useState<Spell | null>(null);
  const { toast } = useToast();

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

  const handleDeleteSpell = () => {
    if (!spellToDelete) return;
    try {
        const updatedSpells = spells.filter(s => s.name !== spellToDelete.name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpells));
        setSpells(updatedSpells);
        toast({
            title: "Spell Deleted",
            description: `"${spellToDelete.name}" has been deleted.`
        });
        setSpellToDelete(null);
    } catch (error) {
        console.error("Failed to delete spell:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the spell." });
    }
  };

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
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {spells.map((spell) => (
                    <TableRow key={spell.name}>
                        <TableCell className="font-medium">{spell.name}</TableCell>
                        <TableCell>{spell.level === 0 ? "Cantrip" : spell.level}</TableCell>
                        <TableCell><Badge variant="outline">{spell.school}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{spell.time}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/spells/edit?name=${encodeURIComponent(spell.name)}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {spell.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setSpellToDelete(spell)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {spell.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
         <AlertDialog open={!!spellToDelete} onOpenChange={(open) => !open && setSpellToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{spellToDelete?.name}" spell.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSpellToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSpell} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
