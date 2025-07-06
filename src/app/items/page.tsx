
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Item } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getGlobalCollection, deleteGlobalDoc, seedGlobalData } from '@/lib/firestore';

const initialItems: Item[] = [
  {
    id: 'item-1',
    name: "Longsword",
    type: "Weapon",
    weight: 3,
    property: ["Versatile (1d10)"],
    text: "A standard steel longsword.",
    dmg1: "1d8",
    dmgType: "Slashing"
  },
  {
    id: 'item-dagger',
    name: "Dagger",
    type: "Weapon",
    weight: 1,
    property: ["Finesse", "Light", "Thrown"],
    text: "A simple dagger.",
    dmg1: "1d4",
    dmgType: "Piercing"
  },
  {
    id: 'item-staff',
    name: "Quarterstaff",
    type: "Weapon",
    weight: 4,
    property: ["Versatile (1d8)"],
    text: "A simple wooden staff.",
    dmg1: "1d6",
    dmgType: "Bludgeoning"
  },
  {
    id: 'item-2',
    name: "Potion of Healing",
    type: "Consumable",
    weight: 0.5,
    text: "A character who drinks the magical red fluid in this vial regains 2d4 + 2 hit points.",
    detail: ["Heals 2d4 + 2 HP"]
  },
  {
    id: 'item-3',
    name: "Cloak of Invisibility",
    type: "Wondrous Item",
    magic: true,
    weight: 1,
    text: "While wearing this cloak, you can pull its hood over your head to become invisible. While you are invisible, anything you are carrying or wearing is invisible with you. You remain invisible until you pull the hood back, or until something causes you to become visible.",
    detail: ["Grants invisibility"]
  }
];

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            await seedGlobalData('items', initialItems, 'id');
            const data = await getGlobalCollection<Item>('items');
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch items.' });
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [toast]);

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
        await deleteGlobalDoc('items', itemToDelete.id);
        setItems(items.filter(i => i.id !== itemToDelete.id));
        toast({ title: "Item Deleted", description: `"${itemToDelete.name}" has been deleted.` });
    } catch (error) {
        console.error("Failed to delete item:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the item." });
    } finally {
        setItemToDelete(null);
    }
  };

  if (loading) {
    return <div>Loading items...</div>;
  }

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
                        <TableHead>Details</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}{item.magic && ' ✨'}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.property?.map(p => (
                              <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                             {item.detail?.map(d => (
                              <Badge key={d} variant="outline">{d}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.text}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/items/edit?id=${item.id}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {item.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setItemToDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {item.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{itemToDelete?.name}" item.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
