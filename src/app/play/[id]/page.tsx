'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Character = {
  id: string;
  name: string;
  avatarUrl: string;
};

type Campaign = {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  characters: Character[];
};

const STORAGE_KEY = 'dnd_campaigns';


export default function CampaignDetailPage({ params }: { params: { id: string } }) {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY);
            if (storedCampaigns) {
                const campaigns: Campaign[] = JSON.parse(storedCampaigns);
                const currentCampaign = campaigns.find(c => c.id === params.id);
                if (currentCampaign && !currentCampaign.description) {
                    currentCampaign.description = 'A classic adventure filled with mystery, danger, and a fortress swallowed by the earth.';
                }
                setCampaign(currentCampaign || null);
            }
        } catch (error) {
            console.error("Failed to load campaign from localStorage", error);
        }
        setLoading(false);
    }, [params.id]);

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
                    <CardTitle className="text-4xl font-headline">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5" />
                            Characters in this Campaign
                        </h3>
                        <div className="flex flex-wrap items-center gap-4">
                            {campaign.characters.map(char => (
                                <div key={char.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card-foreground/5">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                        <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{char.name}</span>
                                </div>
                            ))}
                             <Button variant="outline" className="h-auto aspect-square p-0 flex flex-col gap-1">
                                <UserPlus className="h-5 w-5" />
                                <span className="text-xs">Add</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                 <Button asChild size="lg">
                    <Link href={`/play/${params.id}/play`}>
                        <Play className="mr-2 h-5 w-5" />
                        Start Session
                    </Link>
                </Button>
            </div>
        </div>
    );
}
