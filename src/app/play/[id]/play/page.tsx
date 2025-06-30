'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Campaign, Scene } from '@/lib/types';

const STORAGE_KEY = 'dnd_campaigns';

export default function MapViewPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [scene, setScene] = useState<Scene | null>(null);
    const [loading, setLoading] =useState(true);

    useEffect(() => {
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY);
            if (storedCampaigns) {
                const campaigns: Campaign[] = JSON.parse(storedCampaigns);
                const currentCampaign = campaigns.find(c => c.id === id);
                const activeScene = currentCampaign?.scenes.find(s => s.is_active);
                setScene(activeScene || null);
            }
        } catch (error) {
            console.error("Failed to load scene from localStorage", error);
        }
        setLoading(false);
    }, [id]);

    if (loading) {
        return <div className="text-center p-8">Loading scene...</div>
    }

    if (!scene) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-semibold">No active scene found</h2>
                <p className="text-muted-foreground">Go to the campaign settings to activate a scene.</p>
                 <Button asChild variant="ghost" className="mt-4">
                    <Link href={`/play/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Campaign
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-10rem)] w-full flex flex-col">
            {/* Header Controls */}
            <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm p-2 border-b rounded-t-lg flex items-center justify-between">
                <div>
                     <Button asChild variant="ghost">
                        <Link href={`/play/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Campaign
                        </Link>
                    </Button>
                </div>
                 <h2 className="text-lg font-semibold">Active Scene: {scene.name}</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"><ZoomIn /></Button>
                    <Button variant="outline" size="icon"><ZoomOut /></Button>
                    <Button variant="outline" size="icon"><Grid /></Button>
                </div>
            </div>
            
            {/* Map Area */}
            <div className="flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg">
                <Image
                    src={scene.background_map_url}
                    alt="Fantasy battle map"
                    fill
                    className="object-cover"
                    data-ai-hint="fantasy map"
                />

                {/* Tokens */}
                {scene.tokens.map(token => (
                    <div
                        key={token.id}
                        className="absolute group cursor-pointer"
                        style={{
                            left: `${token.position.x}%`,
                            top: `${token.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                         <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform group-hover:scale-110">
                            <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                            <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                        </Avatar>
                         <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {token.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
