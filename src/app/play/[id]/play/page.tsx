
'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Campaign, Scene, Token, PlayerCharacter } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';

export default function MapViewPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [loading, setLoading] = useState(true);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [draggedToken, setDraggedToken] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

    useEffect(() => {
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            if (storedCampaigns) {
                const campaigns: Campaign[] = JSON.parse(storedCampaigns);
                const currentCampaign = campaigns.find(c => c.id === id);
                setCampaign(currentCampaign || null);
                const activeScene = currentCampaign?.scenes.find(s => s.is_active);
                setScene(activeScene || null);
            }
            
            const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
            if (storedCharacters) {
                setAllPlayerCharacters(JSON.parse(storedCharacters));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
        setLoading(false);
    }, [id]);
    
    const saveCampaignChanges = (updatedScene: Scene) => {
        if (!campaign) return;
        
        const updatedCampaign: Campaign = {
            ...campaign,
            scenes: campaign.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)
        };

        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
            const updatedCampaigns = campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
            setCampaign(updatedCampaign);
        } catch (error) {
            console.error("Failed to save campaign:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save token positions." });
        }
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, tokenId: string) => {
        e.preventDefault();
        const tokenElement = e.currentTarget;
        const rect = tokenElement.getBoundingClientRect();
        
        // Calculate offset from the top-left of the token
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        setDraggedToken({ id: tokenId, offsetX, offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!draggedToken || !mapContainerRef.current) return;
        
        const containerRect = mapContainerRef.current.getBoundingClientRect();
        
        // Calculate new position relative to the container
        let newX = e.clientX - containerRect.left - draggedToken.offsetX;
        let newY = e.clientY - containerRect.top - draggedToken.offsetY;

        // Convert pixel coordinates to percentage
        let newXPercent = (newX / containerRect.width) * 100;
        let newYPercent = (newY / containerRect.height) * 100;

        // Constrain to map boundaries
        newXPercent = Math.max(0, Math.min(100, newXPercent));
        newYPercent = Math.max(0, Math.min(100, newYPercent));
        
        setScene(prevScene => {
            if (!prevScene) return null;
            return {
                ...prevScene,
                tokens: prevScene.tokens.map(token => 
                    token.id === draggedToken.id 
                        ? { ...token, position: { x: newXPercent, y: newYPercent } } 
                        : token
                )
            };
        });
    };

    const handleMouseUp = () => {
        if (draggedToken && scene) {
            saveCampaignChanges(scene);
        }
        setDraggedToken(null);
    };

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
            <div 
                className="flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg select-none"
                ref={mapContainerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the area
            >
                <Image
                    src={scene.background_map_url}
                    alt="Fantasy battle map"
                    fill
                    className="object-cover"
                    data-ai-hint="fantasy map"
                    draggable="false"
                />

                {/* Tokens */}
                {scene.tokens.map(token => {
                    const isPlayer = token.type === 'character';
                    const playerChar = isPlayer 
                        ? allPlayerCharacters.find(pc => pc.id === token.linked_character_id)
                        : null;

                    const health = isPlayer ? playerChar?.hp : token.hp;
                    const maxHealth = isPlayer ? playerChar?.maxHp : token.maxHp;
                    const magic = isPlayer ? playerChar?.mp : token.mp;
                    const maxMagic = isPlayer ? playerChar?.maxMp : token.maxMp;

                    const healthPercent = ((health || 0) / (maxHealth || 1)) * 100;
                    const magicPercent = ((magic || 0) / (maxMagic || 1)) * 100;
                    
                    const showHealthBar = maxHealth !== undefined && maxHealth > 0;
                    const showMagicBar = maxMagic !== undefined && maxMagic > 0;

                    return (
                        <div
                            key={token.id}
                            className="absolute group"
                            style={{
                                left: `${token.position.x}%`,
                                top: `${token.position.y}%`,
                                transform: 'translate(-50%, -50%)',
                                cursor: draggedToken?.id === token.id ? 'grabbing' : 'grab',
                                zIndex: draggedToken?.id === token.id ? 10 : 1,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, token.id)}
                        >
                            <div className="relative w-16 flex flex-col items-center">
                                {/* Health and Magic Bars */}
                                {(showHealthBar || showMagicBar) && (
                                    <div className="w-12 mb-1 space-y-0.5">
                                        {showHealthBar && (
                                            <Progress value={healthPercent} className="h-1.5 bg-red-900/50 [&>div]:bg-red-500" />
                                        )}
                                        {showMagicBar && (
                                            <Progress value={magicPercent} className="h-1.5 bg-blue-900/50 [&>div]:bg-blue-500" />
                                        )}
                                    </div>
                                )}
                                
                                <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform group-hover:scale-110">
                                    <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                                    <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                                </Avatar>
                                
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {token.name}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
