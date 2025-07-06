
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Scene } from '@/lib/types';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { saveDocForUser } from "@/lib/firestore";

export default function NewCampaignPage() {
  const [campaignName, setCampaignName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!campaignName.trim() || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and provide a campaign name.' });
        return;
    }

    setIsCreating(true);

    const newScene: Scene = {
        id: `scene-${Date.now()}`,
        name: 'My First Scene',
        background_map_url: 'https://placehold.co/1200x800.png',
        tokens: [],
        is_active: true,
        width: 30,
        height: 20,
    };
    
    const newCampaignId = String(Date.now());
    const newCampaign = {
        userId: user.uid,
        name: campaignName,
        imageUrl: 'https://placehold.co/400x225.png',
        characters: [],
        scenes: [newScene],
        collaboratorIds: [],
    };

    saveDocForUser('campaigns', newCampaignId, newCampaign)
        .then(() => {
            toast({ title: "Campaign Created!", description: "Your new adventure awaits." });
            router.push('/play');
            // No need to setIsCreating(false) on success, because we navigate away
        })
        .catch((error: any) => {
            console.error("Failed to create campaign:", error);
            toast({
                variant: 'destructive',
                title: 'Creation Failed',
                description: `Could not create campaign. This may be due to database security rules. Please check your Firebase console.`,
                duration: 9000,
            });
            setIsCreating(false); // Re-enable button on failure
        });
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
                        disabled={isCreating}
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isCreating || !campaignName.trim()}>
                        {isCreating ? 'Creating...' : 'Create Campaign'}
                    </Button>
                </div>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
