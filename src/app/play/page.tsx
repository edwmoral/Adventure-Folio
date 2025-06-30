import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CampaignCard } from '@/components/campaign-card';

const mockCampaigns = [
  {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png' },
      { name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png' },
      { name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    imageUrl: 'https://placehold.co/400x225.png',
     characters: [
      { name: 'Gandalf', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    id: '3',
    name: 'Lost Mine of Phandelver',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { name: 'Bilbo', avatarUrl: 'https://placehold.co/40x40.png' },
      { name: 'Frodo', avatarUrl: 'https://placehold.co/40x40.png' },
      { name: 'Sam', avatarUrl: 'https://placehold.co/40x40.png' },
       { name: 'Pippin', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
  },
];

export default function PlayDashboardPage() {
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
      
      {mockCampaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockCampaigns.map((campaign) => (
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
