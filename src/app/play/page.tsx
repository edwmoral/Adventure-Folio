
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { CampaignCard } from '@/components/campaign-card';
import type { Campaign } from '@/lib/types';
import { initialMockCampaigns, initialPlayerCharacters } from '@/lib/mock-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { cleanupUnusedMaps, cleanupUnusedNarrations, saveCampaignsAndCleanup } from '@/lib/storage-utils';

const STORAGE_KEY = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_MAPS = 'dnd_scene_maps';

export default function PlayDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(STORAGE_KEY);
      if (storedCampaigns) {
        setCampaigns(JSON.parse(storedCampaigns));
      } else {
        setCampaigns(initialMockCampaigns);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockCampaigns));
      }
      
      const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
      if (!storedCharacters) {
        localStorage.setItem(STORAGE_KEY_PLAYER_CHARACTERS, JSON.stringify(initialPlayerCharacters));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setCampaigns(initialMockCampaigns);
    }
  }, []);

  const handleDeleteCampaign = () => {
    if (!campaignToDelete) return;

    const updatedCampaigns = campaigns.filter(c => c.id !== campaignToDelete.id);
    saveCampaignsAndCleanup(updatedCampaigns);
    setCampaigns(updatedCampaigns);
    
    toast({
      title: "Campaign Deleted",
      description: `"${campaignToDelete.name}" has been permanently deleted.`
    });
    
    setCampaignToDelete(null);
  };

  const handleStorageCleanup = () => {
    try {
      const mapsDeleted = cleanupUnusedMaps();
      const narrationsDeleted = cleanupUnusedNarrations();
      const totalDeleted = mapsDeleted + narrationsDeleted;

      if (totalDeleted > 0) {
        toast({
            title: "Cleanup Complete",
            description: `${totalDeleted} unused asset(s) have been deleted (${mapsDeleted} maps, ${narrationsDeleted} narrations).`,
        });
      } else {
          toast({
              title: "Nothing to Clean",
              description: "No unlinked assets were found. To free up more space, please delete old campaigns or scenes manually.",
              duration: 8000,
          });
      }
    } catch (error) {
      console.error("Failed to clean up assets:", error);
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Could not clean up unused assets.",
      });
    }
    setClearCacheDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Campaigns</h1>
        <div className="flex gap-2">
            <AlertDialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Clean Up Storage
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Clean up unused assets?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will scan for any AI-generated map images and narration audio that are no longer linked to a scene and delete them to free up space. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStorageCleanup}>
                    Clean Up
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
            <Button asChild>
            <Link href="/play/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
            </Link>
            </Button>
        </div>
      </div>
      
      {campaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              onDelete={() => setCampaignToDelete(campaign)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Campaigns Yet</h2>
          <p className="text-muted-foreground mt-2">Get started by creating your first campaign.</p>
          <Button asChild className="mt-4">
             <Link href="/play/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
             </Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{campaignToDelete?.name}" campaign and all its related scenes and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCampaignToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
