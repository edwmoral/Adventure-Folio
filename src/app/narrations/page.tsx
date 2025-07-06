
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Campaign, Scene, Narration } from '@/lib/types';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PREBUILT_VOICES } from '@/lib/dnd-data';

type NarrationListItem = Narration & {
    campaignName: string;
    campaignId: string;
    sceneName: string;
    sceneId: string;
};

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';

export default function NarrationsPage() {
  const [narrations, setNarrations] = useState<NarrationListItem[]>([]);
  const [narrationToDelete, setNarrationToDelete] = useState<NarrationListItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
      if (storedCampaigns) {
        const campaigns: Campaign[] = JSON.parse(storedCampaigns);
        const allNarrations = campaigns.flatMap(campaign =>
            (campaign.scenes || []).flatMap(scene =>
                (scene.narrations || []).map(narration => ({
                    ...narration,
                    campaignName: campaign.name,
                    campaignId: campaign.id,
                    sceneName: scene.name,
                    sceneId: scene.id,
                }))
            )
        );
        setNarrations(allNarrations);
      }
    } catch (error) {
      console.error("Failed to load narrations from localStorage:", error);
      toast({ variant: 'destructive', title: 'Load Failed', description: 'Could not load narration data.' });
    }
  }, [toast]);

  const handleDeleteNarration = () => {
    if (!narrationToDelete) return;
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
        if (!storedCampaigns) return;

        const campaigns: Campaign[] = JSON.parse(storedCampaigns);
        const campaignIndex = campaigns.findIndex(c => c.id === narrationToDelete.campaignId);
        if (campaignIndex === -1) return;

        const sceneIndex = campaigns[campaignIndex].scenes.findIndex(s => s.id === narrationToDelete.sceneId);
        if (sceneIndex === -1) return;
        
        campaigns[campaignIndex].scenes[sceneIndex].narrations = (campaigns[campaignIndex].scenes[sceneIndex].narrations || []).filter(
            n => n.id !== narrationToDelete.id
        );
        
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));

        setNarrations(prev => prev.filter(n => n.id !== narrationToDelete.id));

        toast({ title: "Narration Deleted", description: `The narration has been deleted.` });
        setNarrationToDelete(null);
    } catch (error) {
        console.error("Failed to delete narration:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the narration." });
    }
  };

  const getVoiceName = (voiceId: string) => {
    return PREBUILT_VOICES.find(v => v.id === voiceId)?.name || voiceId;
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">NARRATIONS</h1>
        </div>
         {narrations.length > 0 ? (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Summary</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Scene</TableHead>
                            <TableHead>Voice</TableHead>
                            <TableHead className="w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {narrations.map((narration) => (
                        <TableRow key={narration.id}>
                            <TableCell className="font-medium max-w-sm truncate" title={narration.plotSummary}>{narration.plotSummary}</TableCell>
                            <TableCell className="text-muted-foreground">{narration.campaignName}</TableCell>
                            <TableCell className="text-muted-foreground">{narration.sceneName}</TableCell>
                             <TableCell className="text-muted-foreground">{getVoiceName(narration.voice)}</TableCell>
                            <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button asChild variant="outline" size="icon">
                                    <Link href={`/narrations/edit?campaignId=${narration.campaignId}&sceneId=${narration.sceneId}&narrationId=${narration.id}`}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit Narration</span>
                                    </Link>
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setNarrationToDelete(narration)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete Narration</span>
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
         ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No Narrations Found</h2>
                <p className="text-muted-foreground mt-2">Generate your first narration from the game board.</p>
            </div>
         )}
        <AlertDialog open={!!narrationToDelete} onOpenChange={(open) => !open && setNarrationToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this narration. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNarrationToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteNarration} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
