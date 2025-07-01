
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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
    setCampaigns(updatedCampaigns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
    
    toast({
      title: "Campaign Deleted",
      description: `"${campaignToDelete.name}" has been permanently deleted.`
    });
    
    setCampaignToDelete(null);
  };

  const handleClearImageCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_MAPS);
      toast({
        title: "Image Cache Cleared",
        description: "All AI-generated map images have been deleted.",
      });
    } catch (error) {
      console.error("Failed to clear image cache:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not clear the image cache.",
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
                Clear Image Cache
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all AI-generated map images from your browser's storage, which can help free up space. Scenes using these maps will revert to placeholders.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearImageCache} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete All Images
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
