
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
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const addStatus = (message: string) => {
    setStatusMessages(prev => [...prev, message]);
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessages([]);

    addStatus("1. Submit button clicked. Validating inputs...");
    if (!campaignName.trim() || !user) {
        const errorMsg = "Validation failed: Campaign name is required and you must be logged in.";
        addStatus(`   - ERROR: ${errorMsg}`);
        toast({ variant: 'destructive', title: 'Error', description: errorMsg });
        return;
    }
    addStatus("   - Validation successful.");

    setIsCreating(true);

    addStatus("2. Preparing new campaign data...");
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
    addStatus("   - Data prepared successfully.");

    try {
      addStatus("3. Attempting to save to Firestore via `saveDocForUser`...");
      await saveDocForUser('campaigns', newCampaignId, newCampaign);
      
      addStatus("4. Save successful! Redirecting...");
      toast({ title: "Campaign Created!", description: "Your new adventure awaits." });
      router.push('/play');

    } catch (error: any) {
        const errorMsg = `Save to Firestore failed. This is likely a security rules issue. Please check your Firebase project settings to ensure you can write to the 'campaigns' collection. Error: ${error.message}`;
        addStatus(`4. CATCH BLOCK TRIGGERED. ERROR: ${errorMsg}`);
        console.error("Failed to create campaign:", error);
        toast({
            variant: 'destructive',
            title: 'Creation Failed',
            description: `Could not create campaign. Check the status messages for details.`,
            duration: 9000,
        });
    } finally {
        // This will run whether the try block succeeds or fails.
        setIsCreating(false);
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
                        disabled={isCreating}
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isCreating || !campaignName.trim()}>
                        {isCreating ? 'Creating...' : 'Create Campaign'}
                    </Button>
                </div>
            </form>
            {statusMessages.length > 0 && (
                <div className="mt-6 p-4 border rounded-md bg-muted/50">
                    <h4 className="font-semibold mb-2">Creation Status:</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                        {statusMessages.join('\n')}
                    </pre>
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
