'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CampaignCard } from '@/components/campaign-card';

type Character = {
  id: string;
  name: string;
  avatarUrl: string;
};

type Campaign = {
  id: string;
  name: string;
  imageUrl: string;
  characters: Character[];
};

const initialMockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    imageUrl: 'https://placehold.co/400x225.png',
     characters: [
      { id: 'char4', name: 'Gandalf', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    id: '3',
    name: 'Lost Mine of Phandelver',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char5', name: 'Bilbo', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char6', name: 'Frodo', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char7', name: 'Sam', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char8', name: 'Pippin', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
];

const STORAGE_KEY = 'dnd_campaigns';

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
