'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Campaign, Scene } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STORAGE_KEY = 'dnd_campaigns';

const RESOLUTION_PRESETS = [
    { label: '1920x1080 (16:9)', value: '1920x1080' },
    { label: '2048x2048 (Square)', value: '2048x2048' },
    { label: '4096x3072 (Large Map)', value: '4096x3072' },
];

export default function NewScenePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [sceneName, setSceneName] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [resolution, setResolution] = useState(RESOLUTION_PRESETS[0].value);
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sceneName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Scene name is required.' });
      return;
    }

    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        if (!storedCampaigns) {
            toast({ variant: 'destructive', title: 'Error', description: 'Campaign data not found.' });
            return;
        }
        
        const campaigns: Campaign[] = JSON.parse(storedCampaigns);
        const campaignIndex = campaigns.findIndex(c => c.id === id);

        if (campaignIndex === -1) {
            toast({ variant: 'destructive', title: 'Error', description: 'Campaign not found.' });
            return;
        }

        const [width, height] = resolution.split('x').map(Number);
        
        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name: sceneName,
            background_map_url: backgroundUrl || `https://placehold.co/${width}x${height}.png`,
            tokens: [], // New scenes start with no tokens; they are added when characters are added
            is_active: campaigns[campaignIndex].scenes.length === 0, // First scene is active
            resolution: { width, height }
        };

        campaigns[campaignIndex].scenes.push(newScene);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

        toast({ title: "Scene Created!", description: "Your new scene has been added to the campaign." });
        router.push(`/play/${id}/edit`);

    } catch (error) {
        console.error("Failed to create scene:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new scene." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href={`/play/${id}/edit`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaign Edit
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create New Scene</CardTitle>
            <CardDescription>
                Add a new map for your players to explore.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="scene-name">Scene Name</Label>
                    <Input 
                        id="scene-name" 
                        placeholder="e.g., The Whispering Caverns" 
                        value={sceneName}
                        onChange={(e) => setSceneName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="background-url">Background Image URL (Optional)</Label>
                    <Input 
                        id="background-url" 
                        placeholder="https://example.com/map.png" 
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">If empty, a placeholder will be used based on resolution.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="resolution">Map Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger id="resolution">
                            <SelectValue placeholder="Select a resolution..." />
                        </SelectTrigger>
                        <SelectContent>
                            {RESOLUTION_PRESETS.map(preset => (
                                <SelectItem key={preset.value} value={preset.value}>
                                    {preset.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Create Scene</Button>
                </div>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
