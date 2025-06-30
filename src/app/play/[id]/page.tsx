'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Users, UserPlus, Pencil, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'dnd_campaigns';


export default function CampaignDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY);
            if (storedCampaigns) {
                const campaigns: Campaign[] = JSON.parse(storedCampaigns);
                const currentCampaign = campaigns.find(c => c.id === id);
                setCampaign(currentCampaign || null);
            }
        } catch (error) {
            console.error("Failed to load campaign from localStorage", error);
        }
        setLoading(false);
    }, [id]);

    const handleRemoveCharacter = (characterId: string) => {
        if (!campaign) return;

        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY);
            if (!storedCampaigns) return;

            let campaigns: Campaign[] = JSON.parse(storedCampaigns);
            const campaignIndex = campaigns.findIndex(c => c.id === campaign.id);
            if (campaignIndex === -1) return;

            const updatedCampaign = { ...campaigns[campaignIndex] };
            
            const removedChar = updatedCampaign.characters.find(c => c.id === characterId);

            updatedCampaign.characters = updatedCampaign.characters.filter(c => c.id !== characterId);
            
            updatedCampaign.scenes = updatedCampaign.scenes.map(scene => ({
                ...scene,
                tokens: scene.tokens.filter(token => token.linked_character_id !== characterId)
            }));

            campaigns[campaignIndex] = updatedCampaign;

            localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

            setCampaign(updatedCampaign);

            toast({ title: "Character Removed", description: `${removedChar?.name || 'The character'} has been removed from the campaign.` });
        } catch (error) {
            console.error("Failed to remove character:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not remove character." });
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading campaign...</div>;
    }
    
    if (!campaign) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Campaign not found</h1>
                <p className="text-muted-foreground">The campaign you are looking for does not exist.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/play">Back to Campaigns</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <Button asChild variant="ghost">
                <Link href="/play">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaigns
                </Link>
            </Button>
            
            <Card className="overflow-hidden">
                <div className="relative h-48 md:h-64 w-full">
                    <Image
                        src={campaign.imageUrl}
                        alt={`${campaign.name} banner image`}
                        fill
                        className="object-cover"
                        data-ai-hint="fantasy landscape"
                    />
                </div>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-4xl font-headline">{campaign.name}</CardTitle>
                            <CardDescription>A classic adventure filled with mystery, danger, and a fortress swallowed by the earth.</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="icon">
                            <Link href={`/play/${campaign.id}/edit`}>
                                <Pencil className="h-5 w-5" />
                                <span className="sr-only">Edit Campaign</span>
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5" />
                            Characters in this Campaign
                        </h3>
                        <div className="flex flex-wrap items-center gap-6">
                            {campaign.characters.map(char => (
                                <div key={char.id} className="relative group/char">
                                    <div className="flex items-center gap-2 p-2 pr-3 border rounded-lg bg-card-foreground/5 transition-all group-hover/char:border-primary/50">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                            <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{char.name}</span>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover/char:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveCharacter(char.id)}
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Remove {char.name}</span>
                                    </Button>
                                </div>
                            ))}
                             <Button asChild variant="outline" className="h-auto p-2 flex items-center justify-center flex-col gap-1 w-[68px] h-[60px] border-dashed hover:border-solid">
                                <Link href={`/play/${campaign.id}/edit`}>
                                    <UserPlus className="h-5 w-5" />
                                    <span className="text-xs">Add</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                 <Button asChild size="lg">
                    <Link href={`/play/${id}/play`}>
                        <Play className="mr-2 h-5 w-5" />
                        Start Session
                    </Link>
                </Button>
            </div>
        </div>
    );
}
