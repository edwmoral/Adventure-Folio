
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CampaignCard } from '@/components/campaign-card';
import type { Campaign } from '@/lib/types';
import { initialMockCampaigns, initialPlayerCharacters } from '@/lib/mock-data';

const STORAGE_KEY = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';

export default function PlayDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Campaigns</h1>
        <Button asChild>
          <Link href="/play/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>
      
      {campaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
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
    </div>
  );
}
