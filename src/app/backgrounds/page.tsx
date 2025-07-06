'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Background } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getUserCollection, deleteUserDoc, seedInitialUserData } from '@/lib/firestore';

const initialBackgrounds: Background[] = [
  {
    name: "Soldier",
    text: "You trained for war and fought in one or more conflicts. You're skilled in military tactics and combat.",
    proficiency: ["Athletics", "Intimidation", "One type of gaming set", "Vehicles (land)"],
    trait: [{ name: "Military Rank", text: "You have a military rank from your career as a soldier." }],
  }
];

export default function BackgroundsPage() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [backgroundToDelete, setBackgroundToDelete] = useState<Background | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let data = await getUserCollection<Background>('backgrounds');
        if (data.length === 0) {
          await seedInitialUserData('backgrounds', initialBackgrounds, 'name');
          data = await getUserCollection<Background>('backgrounds');
        }
        setbackgrounds(data);
      } catch (error) {
        console.error("Failed to fetch backgrounds:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch backgrounds.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  const handleDeleteBackground = async () => {
    if (!user || !backgroundToDelete) return;
    try {
        await deleteUserDoc('backgrounds', backgroundToDelete.name);
        setBackgrounds(backgrounds.filter(b => b.name !== backgroundToDelete.name));
        toast({ title: "Background Deleted", description: `"${backgroundToDelete.name}" has been deleted.` });
    } catch (error) {
        console.error("Failed to delete background:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the background." });
    } finally {
        setBackgroundToDelete(null);
    }
  };

  if (loading) {
    return <div>Loading backgrounds...</div>;
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">BACKGROUNDS</h1>
            <Button asChild>
                <Link href="/backgrounds/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Background
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Proficiencies</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {backgrounds.map((background) => (
                    <TableRow key={background.name}>
                        <TableCell className="font-medium">{background.name}</TableCell>
                        <TableCell className="text-muted-foreground">{background.text}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {background.proficiency?.map(skill => (
                              <Badge key={skill} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/backgrounds/edit?name=${encodeURIComponent(background.name)}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {background.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setBackgroundToDelete(background)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {background.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!backgroundToDelete} onOpenChange={(open) => !open && setBackgroundToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{backgroundToDelete?.name}" background.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBackground} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
