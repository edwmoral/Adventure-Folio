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
import { cleanupUnusedNarrations } from '@/lib/storage-utils';
import { useAuth } from '@/context/auth-context';
import { getCollectionForUser, deleteGlobalDoc, saveDocForUser, getSharedCampaignsForUser, seedGlobalData, getGlobalCollection } from '@/lib/firestore';

export default function PlayDashboardPage() {
  const { user } = useAuth();
  const [ownedCampaigns, setOwnedCampaigns] = useState<(Campaign & { id: string })[]>([]);
  const [sharedCampaigns, setSharedCampaigns] = useState<(Campaign & { id: string })[]>([]);
  const [campaignToDelete, setCampaignToDelete] = useState<(Campaign & { id: string }) | null>(null);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userCampaigns, sharedCampaignsData] = await Promise.all([
            getCollectionForUser<Campaign>('campaigns'),
            getSharedCampaignsForUser<Campaign>('campaigns')
        ]);
        
        if (userCampaigns.length === 0 && sharedCampaignsData.length === 0) {
          // Seed initial campaigns for the new user
          const seedPromises = initialMockCampaigns.map(campaign => 
            saveDocForUser('campaigns', campaign.id, { ...campaign, userId: user.uid, collaboratorIds: [] })
          );
          await Promise.all(seedPromises);
          
          // Seed initial player characters if they don't exist
          const existingChars = await getCollectionForUser<PlayerCharacter>('playerCharacters');
          if (existingChars.length === 0) {
              const charSeedPromises = initialPlayerCharacters.map(char => 
                  saveDocForUser('playerCharacters', char.id, char)
              );
              await Promise.all(charSeedPromises);
          }
          
          const seededCampaigns = await getCollectionForUser<Campaign>('campaigns');
          setOwnedCampaigns(seededCampaigns);
        } else {
          setOwnedCampaigns(userCampaigns);
          setSharedCampaigns(sharedCampaignsData);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch campaigns.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteGlobalDoc('campaigns', campaignToDelete.id);
      const updatedCampaigns = ownedCampaigns.filter(c => c.id !== campaignToDelete.id);
      setOwnedCampaigns(updatedCampaigns);
      
      toast({
        title: "Campaign Deleted",
        description: `"${campaignToDelete.name}" has been permanently deleted.`
      });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete campaign.' });
    } finally {
      setCampaignToDelete(null);
    }
  };

  const handleStorageCleanup = () => {
    try {
      const narrationsDeleted = cleanupUnusedNarrations();

      if (narrationsDeleted > 0) {
        toast({
            title: "Cleanup Complete",
            description: `${narrationsDeleted} unused asset(s) have been deleted.`,
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

  const allCampaigns = [...ownedCampaigns, ...sharedCampaigns];

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
                    This will scan for any AI-generated narration audio that is no longer linked to a scene and delete it to free up space. This action cannot be undone.
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
      
      {loading ? (
        <p>Loading campaigns...</p>
      ) : allCampaigns.length > 0 ? (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Campaigns</h2>
                {ownedCampaigns.length > 0 ? (
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {ownedCampaigns.map((campaign) => (
                            <CampaignCard 
                            key={campaign.id} 
                            campaign={campaign} 
                            isOwner={true}
                            onDelete={() => setCampaignToDelete(campaign)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">You haven't created any campaigns yet.</p>
                )}
            </div>
            {sharedCampaigns.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-semibold mb-4">Shared With Me</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sharedCampaigns.map((campaign) => (
                        <CampaignCard 
                            key={campaign.id} 
                            campaign={campaign}
                            isOwner={false}
                            onDelete={() => {}}
                        />
                    ))}
                    </div>
                </div>
            )}
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
