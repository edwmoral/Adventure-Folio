'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Campaign, Scene, Narration } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveCampaignsAndCleanup } from "@/lib/storage-utils";

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';

export default function EditNarrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const campaignIdParam = searchParams.get('campaignId');
  const sceneIdParam = searchParams.get('sceneId');
  const narrationIdParam = searchParams.get('narrationId');
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [plotSummary, setPlotSummary] = useState('');
  const [narration, setNarration] = useState<Narration | null>(null);

  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [scenesForSelectedCampaign, setScenesForSelectedCampaign] = useState<Scene[]>([]);
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  useEffect(() => {
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
        if (storedCampaigns) {
            const campaigns: Campaign[] = JSON.parse(storedCampaigns);
            setAllCampaigns(campaigns);

            if (campaignIdParam && sceneIdParam && narrationIdParam) {
                const campaign = campaigns.find(c => c.id === campaignIdParam);
                const scene = campaign?.scenes.find(s => s.id === sceneIdParam);
                const narration = scene?.narrations?.find(n => n.id === narrationIdParam);
                
                if (narration) {
                    setNarration(narration);
                    setPlotSummary(narration.plotSummary);
                    setSelectedCampaignId(campaignIdParam);
                    setSelectedSceneId(sceneIdParam);
                    setScenesForSelectedCampaign(campaign?.scenes || []);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Narration not found.' });
                    router.push('/narrations');
                }
            }
        }
    } catch (error) {
        console.error("Failed to load narration data", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load narration data." });
    }
    setIsLoading(false);
  }, [campaignIdParam, sceneIdParam, narrationIdParam, router, toast]);

  useEffect(() => {
    if (selectedCampaignId) {
        const campaign = allCampaigns.find(c => c.id === selectedCampaignId);
        setScenesForSelectedCampaign(campaign?.scenes || []);
        // Reset scene selection if the campaign changes
        if (selectedCampaignId !== campaignIdParam) {
            setSelectedSceneId(null);
        }
    }
  }, [selectedCampaignId, allCampaigns, campaignIdParam]);


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!plotSummary.trim() || !selectedCampaignId || !selectedSceneId || !narration) {
        toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
        return;
    }

    try {
        let campaigns: Campaign[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CAMPAIGNS) || '[]');
        
        // 1. Remove the original narration
        const originalCampaign = campaigns.find(c => c.id === campaignIdParam);
        if (originalCampaign) {
            const originalScene = originalCampaign.scenes.find(s => s.id === sceneIdParam);
            if (originalScene) {
                originalScene.narrations = (originalScene.narrations || []).filter(n => n.id !== narrationIdParam);
            }
        }
        
        // 2. Add the updated narration to the new location
        const targetCampaign = campaigns.find(c => c.id === selectedCampaignId);
        if (targetCampaign) {
            const targetScene = targetCampaign.scenes.find(s => s.id === selectedSceneId);
            if (targetScene) {
                const updatedNarration: Narration = {
                    ...narration,
                    plotSummary: plotSummary,
                };
                if (!targetScene.narrations) {
                    targetScene.narrations = [];
                }
                targetScene.narrations.push(updatedNarration);
            }
        }
        
        saveCampaignsAndCleanup(campaigns);
        toast({ title: "Narration Updated!", description: "The narration has been successfully updated." });
        router.push(`/narrations`);

    } catch (error) {
        console.error("Failed to update narration:", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the narration." });
    }
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/narrations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Narrations
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Edit Narration</CardTitle>
                <CardDescription>
                    Update the summary or reassign this narration to a different scene.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="plotSummary">Plot Summary</Label>
                        <Textarea id="plotSummary" value={plotSummary} onChange={(e) => setPlotSummary(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="campaign">Campaign</Label>
                            <Select value={selectedCampaignId || ''} onValueChange={setSelectedCampaignId}>
                                <SelectTrigger id="campaign"><SelectValue placeholder="Select campaign..." /></SelectTrigger>
                                <SelectContent>
                                    {allCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="scene">Scene</Label>
                            <Select value={selectedSceneId || ''} onValueChange={setSelectedSceneId} disabled={!selectedCampaignId}>
                                <SelectTrigger id="scene"><SelectValue placeholder="Select scene..." /></SelectTrigger>
                                <SelectContent>
                                    {scenesForSelectedCampaign.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                   
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
