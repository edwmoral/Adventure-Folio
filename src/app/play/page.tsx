
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CampaignCard } from '@/components/campaign-card';
import type { Campaign } from '@/lib/types';

const initialMockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene1',
            name: 'The Goblin Cave',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char1', position: { x: 20, y: 30 } },
                { id: 'token-char2', name: 'Lyra', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char2', position: { x: 25, y: 35 } },
                { id: 'token-char3', name: 'Borg', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char3', position: { x: 15, y: 25 } },
                { id: 'token-monster1', name: 'Goblin 1', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 60, y: 40 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
                { id: 'token-monster2', name: 'Goblin 2', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 65, y: 45 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
            ],
            is_active: true,
        }
    ]
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    imageUrl: 'https://placehold.co/400x225.png',
     characters: [
      { id: 'char4', name: 'Gandalf', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene2',
            name: 'Castle Ravenloft',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                 { id: 'token-char4', name: 'Gandalf', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char4', position: { x: 50, y: 50 } },
            ],
            is_active: true,
        }
    ]
  },
  {
    id: '3',
    name: 'Lost Mine of Phandelver',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char5', name: 'Bilbo', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char6', name: 'Frodo', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char7', name: 'Sam', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char8', name: 'Pippin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene3',
            name: 'Goblin Ambush Trail',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char5', name: 'Bilbo', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char5', position: { x: 30, y: 40 } },
                { id: 'token-char6', name: 'Frodo', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char6', position: { x: 35, y: 45 } },
                { id: 'token-char7', name: 'Sam', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char7', position: { x: 25, y: 35 } },
                { id: 'token-char8', name: 'Pippin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char8', position: { x: 40, y: 50 } },
            ],
            is_active: true,
        }
    ]
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
