'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";

import type { Campaign, Scene } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { generateMapAction } from "./actions";


const STORAGE_KEY = 'dnd_campaigns';


export default function NewScenePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [sceneName, setSceneName] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [isGenerating, startTransition] = useTransition();
  
  const handleGenerateMap = () => {
    startTransition(async () => {
        if (!mapDescription.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a description for the map.' });
            return;
        }
        const result = await generateMapAction(mapDescription);
        if (result.success && result.imageUrl) {
            setBackgroundUrl(result.imageUrl);
            toast({ title: 'Map Generated!', description: 'Your new map is ready.' });
        } else {
            toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
        }
    });
  };

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
        
        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name: sceneName,
            background_map_url: backgroundUrl || `https://placehold.co/1920x1080.png`,
            tokens: [], // New scenes start with no tokens; they are added when characters are added
            is_active: campaigns[campaignIndex].scenes.length === 0, // First scene is active
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
                Add a new map for your players to explore. Describe the scene to generate one with AI, or paste an image URL below.
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
                
                 <div className="space-y-4 rounded-lg border bg-card-foreground/5 p-4">
                    <h3 className="text-lg font-medium flex items-center gap-2"><Sparkles className="text-primary" /> AI Map Generator</h3>
                    <div className="space-y-2">
                        <Label htmlFor="map-description">Map Description</Label>
                        <Textarea 
                            id="map-description"
                            placeholder="e.g., A ruined stone tower in a swamp, with a crumbling bridge over a murky river."
                            value={mapDescription}
                            onChange={(e) => setMapDescription(e.target.value)}
                        />
                    </div>
                    <Button type="button" onClick={handleGenerateMap} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : 'Generate Map'}
                    </Button>
                </div>
                
                {backgroundUrl && (
                    <div className="space-y-2">
                        <Label>Map Preview</Label>
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                            <Image src={backgroundUrl} alt="Generated map preview" fill className="object-cover" />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="background-url">Or Paste an Image URL</Label>
                    <Input 
                        id="background-url" 
                        placeholder="https://example.com/map.png" 
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">This will be replaced if you generate a map. If empty, a placeholder will be used.</p>
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
