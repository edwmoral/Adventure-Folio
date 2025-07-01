
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
  const [actionToDelete, setActionToDelete] = useState<Action | null>(null);
  const { toast } = useToast();

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

  const handleDeleteAction = () => {
    if (!actionToDelete) return;
    try {
        const updatedActions = actions.filter(a => a.name !== actionToDelete.name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));
        setActions(updatedActions);
        toast({ title: "Action Deleted", description: `"${actionToDelete.name}" has been deleted.` });
        setActionToDelete(null);
    } catch (error) {
        console.error("Failed to delete action:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the action." });
    }
  };

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
