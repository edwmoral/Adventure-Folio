'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Campaign, Scene } from '@/lib/types';

const STORAGE_KEY = 'dnd_campaigns';

export default function NewCampaignPage() {
  const [campaignName, setCampaignName] = useState('');
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!campaignName.trim()) {
      return;
    }

    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        
        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name: 'My First Scene',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [],
            is_active: true,
            resolution: { width: 1200, height: 800 }
        };
        
        const newCampaign: Campaign = {
            id: String(Date.now()),
            name: campaignName,
            imageUrl: 'https://placehold.co/400x225.png',
            characters: [],
            scenes: [newScene],
        };

        const updatedCampaigns = [...campaigns, newCampaign];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));

        router.push('/play');

    } catch (error) {
        console.error("Failed to create campaign:", error);
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/play">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
                Give your new adventure a name to get started. You can add more details later.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input 
                        id="campaign-name" 
                        placeholder="e.g., The Dragon's Demise" 
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Create Campaign</Button>
                </div>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
