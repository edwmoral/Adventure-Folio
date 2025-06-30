
'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid, Maximize, Minimize } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Campaign, Scene, Token, PlayerCharacter, Enemy, Action } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ActionPanel } from "@/components/action-panel";

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_ENEMIES = 'dnd_enemies';
const STORAGE_KEY_ACTIONS = 'dnd_actions';

export default function MapViewPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
    const [allActions, setAllActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const [draggedToken, setDraggedToken] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        setLoading(true);
        try {
            const storedCampaignsJSON = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            if (!storedCampaignsJSON) {
                throw new Error("No campaigns found in storage.");
            }

            const campaigns: Campaign[] = JSON.parse(storedCampaignsJSON);
            const campaignIndex = campaigns.findIndex(c => c.id === id);

            if (campaignIndex === -1) {
                throw new Error(`Campaign with ID ${id} not found.`);
            }
            
            const currentCampaign = { ...campaigns[campaignIndex] };
            
            if (!currentCampaign.scenes) {
                currentCampaign.scenes = [];
            }

            let activeScene = currentCampaign.scenes.find(s => s.is_active === true);
            let needsSave = false;

            // If no scene is explicitly active, or more than one is active, fix it.
            if (!activeScene && currentCampaign.scenes.length > 0) {
                // Deactivate all scenes first to handle multiple active scenes.
                currentCampaign.scenes.forEach(s => s.is_active = false);
                currentCampaign.scenes[0].is_active = true;
                activeScene = currentCampaign.scenes[0];
                needsSave = true;
                toast({ title: "Scene Activated", description: `Defaulted to "${activeScene.name}" as the active scene.` });
            } else if (activeScene) {
                const activeScenes = currentCampaign.scenes.filter(s => s.is_active === true);
                if (activeScenes.length > 1) {
                    currentCampaign.scenes.forEach(s => s.is_active = false);
                    currentCampaign.scenes[0].is_active = true;
                    activeScene = currentCampaign.scenes[0];
                    needsSave = true;
                    toast({ title: "Scene Corrected", description: `Multiple active scenes found. Defaulted to "${activeScene.name}".`});
                }
            }

            if (needsSave) {
                campaigns[campaignIndex] = currentCampaign;
                localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
            }
            
            setCampaign(currentCampaign);
            setScene(activeScene || null);

            // Load other data
            const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
            if (storedCharacters) setAllPlayerCharacters(JSON.parse(storedCharacters));
            
            const storedEnemies = localStorage.getItem(STORAGE_KEY_ENEMIES);
            if (storedEnemies) setAllEnemies(JSON.parse(storedEnemies));
            
            const storedActions = localStorage.getItem(STORAGE_KEY_ACTIONS);
            if (storedActions) setAllActions(JSON.parse(storedActions));

        } catch (error) {
            console.error("Failed to load session:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("An unknown error occurred while loading the session.");
        } finally {
            setLoading(false);
        }
    }, [id, toast]);
    
    const saveCampaignChanges = (updatedScene: Scene) => {
        if (!campaign) return;
        
        const updatedCampaign: Campaign = {
            ...campaign,
            scenes: campaign.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)
        };

        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
            const updatedCampaignsList = campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaignsList));
            setCampaign(updatedCampaign);
        } catch (error) {
            console.error("Failed to save campaign:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save token positions." });
        }
    }
    
    const handleTokenClick = (token: Token) => {
        setSelectedToken(token);
        setIsActionPanelOpen(true);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, tokenId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!mapContainerRef.current) return;

        const tokenElement = e.currentTarget;
        const rect = tokenElement.getBoundingClientRect();
        const containerRect = mapContainerRef.current.getBoundingClientRect();

        const tokenCenterX = rect.left + rect.width / 2;
        const tokenCenterY = rect.top + rect.height / 2;

        const offsetX = (e.clientX - tokenCenterX) / zoom;
        const offsetY = (e.clientY - tokenCenterY) / zoom;
        
        setDraggedToken({ id: tokenId, offsetX, offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!draggedToken || !mapContainerRef.current) return;
        
        e.preventDefault();
        e.stopPropagation();
        const containerRect = mapContainerRef.current.getBoundingClientRect();
        
        let newX = (e.clientX - containerRect.left) / zoom - draggedToken.offsetX;
        let newY = (e.clientY - containerRect.top) / zoom - draggedToken.offsetY;

        let newXPercent = (newX / containerRect.width) * 100 * zoom;
        let newYPercent = (newY / containerRect.height) * 100 * zoom;

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

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (draggedToken && scene) {
            saveCampaignChanges(scene);
        }
        setDraggedToken(null);
    };
    
    const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.2));

    const toggleFullscreen = () => {
        const element = fullscreenContainerRef.current;
        if (!element) return;

        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                toast({
                    variant: "destructive",
                    title: "Fullscreen Error",
                    description: `Could not enter full-screen mode: ${err.message}`,
                });
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    
    const toggleGrid = () => setShowGrid(prev => !prev);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

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
        <TooltipProvider>
            <div 
                ref={fullscreenContainerRef} 
                className="h-[calc(100vh-10rem)] w-full flex flex-col bg-background"
            >
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn /></Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Zoom In</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut /></Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Zoom Out</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={toggleGrid}><Grid /></Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle Grid</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                                    {isFullscreen ? <Minimize /> : <Maximize />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                
                {/* Map Area */}
                <div 
                    className="flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg select-none"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        ref={mapContainerRef}
                        className="w-full h-full"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    >
                        <div
                            className="relative w-full h-full"
                            style={{ aspectRatio: `${scene.width || 30}/${scene.height || 20}` }}
                        >
                            <Image
                                src={scene.background_map_url}
                                alt="Fantasy battle map"
                                fill
                                className="object-contain"
                                data-ai-hint="fantasy map"
                                draggable="false"
                            />
                            
                            {showGrid && (
                                <div 
                                    className="absolute inset-0 pointer-events-none" 
                                    style={{
                                        backgroundSize: `${100 / (scene.width || 30)}% ${100 / (scene.height || 20)}%`,
                                        backgroundImage: 'linear-gradient(to right, hsla(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsla(var(--border) / 0.5) 1px, transparent 1px)',
                                    }}
                                />
                            )}

                            {/* Tokens */}
                            {scene.tokens.map(token => {
                                const isPlayer = token.type === 'character';
                                const playerChar = isPlayer 
                                    ? allPlayerCharacters.find(pc => pc.id === token.linked_character_id)
                                    : null;

                                const enemy = !isPlayer ? allEnemies.find(e => e.id === token.linked_enemy_id) : null;
                                
                                const health = isPlayer ? playerChar?.hp : (token.hp ?? enemy?.hit_points);
                                const maxHealth = isPlayer ? playerChar?.maxHp : (token.maxHp ?? enemy?.hit_points);
                                const ac = isPlayer ? playerChar?.ac : enemy?.armor_class;
                                const healthPercent = ((health || 0) / (maxHealth || 1)) * 100;
                                
                                const tokenWidth = 100 / (scene.width || 30);
                                const tokenHeight = 100 / (scene.height || 20);

                                return (
                                    <Tooltip key={token.id}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="absolute group"
                                                style={{
                                                    left: `${token.position.x}%`,
                                                    top: `${token.position.y}%`,
                                                    width: `${tokenWidth}%`,
                                                    height: `${tokenHeight}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    cursor: draggedToken?.id === token.id ? 'grabbing' : 'grab',
                                                }}
                                                onClick={() => handleTokenClick(token)}
                                                onMouseDown={(e) => handleMouseDown(e, token.id)}
                                            >
                                                <div className="relative w-full h-full flex flex-col items-center justify-center p-[5%]">
                                                    {maxHealth && maxHealth > 0 && (
                                                         <Progress value={healthPercent} className={cn("absolute -top-1 w-full h-1", isPlayer ? "bg-green-900/50 [&>div]:bg-green-500" : "bg-red-900/50 [&>div]:bg-red-500")} />
                                                    )}
                                                    
                                                    <Avatar className="h-full w-full border-2 border-primary shadow-lg transition-transform group-hover:scale-105">
                                                        <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                                                        <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="space-y-1 text-sm text-left">
                                                <p className="font-bold">{token.name}</p>
                                                {maxHealth && maxHealth > 0 && <p>HP: {health} / {maxHealth}</p>}
                                                {ac !== undefined && <p>AC: {ac} 🛡️</p>}
                                                {isPlayer && playerChar?.spell_slots && Object.keys(playerChar.spell_slots).length > 0 && (
                                                    <div className="pt-1 mt-1 border-t border-border/50">
                                                        <p className="font-semibold text-xs mb-1">Spell Slots</p>
                                                        <div className="space-y-0.5">
                                                        {Object.entries(playerChar.spell_slots)
                                                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                            .map(([level, slots]) => (
                                                            <p key={level} className="text-xs text-muted-foreground">Lvl {level}: {slots.current} / {slots.max}</p>
                                                        ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                </div>
                 <ActionPanel
                    open={isActionPanelOpen}
                    onOpenChange={setIsActionPanelOpen}
                    token={selectedToken}
                    character={
                        selectedToken?.type === 'character'
                            ? allPlayerCharacters.find(p => p.id === selectedToken.linked_character_id) || null
                            : null
                    }
                    enemy={
                        selectedToken?.type === 'monster'
                            ? allEnemies.find(e => e.id === selectedToken.linked_enemy_id) || null
                            : null
                    }
                    actions={allActions}
                    container={fullscreenContainerRef.current}
                />
            </div>
        </TooltipProvider>
    );
}
