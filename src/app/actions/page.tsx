'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Action } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getUserCollection, deleteUserDoc, seedInitialUserData } from '@/lib/firestore';

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [actionToDelete, setActionToDelete] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let data = await getUserCollection<Action>('actions');
        if (data.length === 0) {
          await seedInitialUserData(user.uid, 'actions');
          data = await getUserCollection<Action>('actions');
        }
        setActions(data);
      } catch (error) {
        console.error("Failed to fetch actions:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch actions.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  const handleDeleteAction = async () => {
    if (!user || !actionToDelete) return;
    try {
        await deleteUserDoc('actions', actionToDelete.name);
        setActions(actions.filter(a => a.name !== actionToDelete.name));
        toast({ title: "Action Deleted", description: `"${actionToDelete.name}" has been deleted.` });
        setActionToDelete(null);
    } catch (error) {
        console.error("Failed to delete action:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the action." });
    }
  };

  if (loading) {
    return <div>Loading actions...</div>;
  }

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
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.name}>
                        <TableCell className="font-medium">{action.name}</TableCell>
                        <TableCell><Badge variant="secondary">{action.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{action.description}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/actions/edit?name=${encodeURIComponent(action.name)}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {action.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setActionToDelete(action)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {action.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
         <AlertDialog open={!!actionToDelete} onOpenChange={(open) => !open && setActionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{actionToDelete?.name}" action.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setActionToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
