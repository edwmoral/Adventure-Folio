
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Feat } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getGlobalCollection, deleteGlobalDoc, seedGlobalData } from '@/lib/firestore';

const initialFeats: Feat[] = [
  {
    name: "Sharpshooter",
    prerequisite: "Proficiency with ranged weapons",
    text: "You can make attacks at long range without disadvantage, and your ranged attacks ignore half and three-quarters cover. Before you make an attack, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage.",
  },
  {
    name: "Tough",
    text: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.",
  },
  {
    name: "Great Weapon Master",
    prerequisite: "Proficiency with a melee weapon",
    text: "On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to a he attack roll. If the attack hits, you add +10 to the attack's damage.",
  }
];

export default function FeaturesPage() {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [featToDelete, setFeatToDelete] = useState<Feat | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            await seedGlobalData('feats', initialFeats, 'name');
            const data = await getGlobalCollection<Feat>('feats');
            setFeats(data);
        } catch (error) {
            console.error("Failed to fetch feats:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch feats.' });
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [toast]);

  const handleDeleteFeat = async () => {
    if (!featToDelete) return;
    try {
        await deleteGlobalDoc('feats', featToDelete.name);
        setFeats(feats.filter(f => f.name !== featToDelete.name));
        toast({ title: "Feat Deleted", description: `"${featToDelete.name}" has been deleted.` });
    } catch (error) {
        console.error("Failed to delete feat:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the feat." });
    } finally {
        setFeatToDelete(null);
    }
  };
  
  if (loading) {
    return <div>Loading feats...</div>;
  }

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
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feats.map(feat => (
                    <TableRow key={feat.name}>
                        <TableCell className="font-medium">{feat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{feat.prerequisite || 'None'}</TableCell>
                        <TableCell className="text-muted-foreground">{feat.text}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/features/edit?name=${encodeURIComponent(feat.name)}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {feat.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setFeatToDelete(feat)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {feat.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!featToDelete} onOpenChange={(open) => !open && setFeatToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{featToDelete?.name}" feat.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setFeatToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteFeat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
