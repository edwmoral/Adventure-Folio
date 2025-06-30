
'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid, Maximize, Minimize, Swords, ShieldCross } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Campaign, Scene, Token, PlayerCharacter, Enemy, Action } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ActionPanel } from "@/components/action-panel";
import { TurnOrderTracker } from "@/components/TurnOrderTracker";

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_MAPS = 'dnd_scene_maps';
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

    const mapInteractionRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const [draggedToken, setDraggedToken] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Combat State
    const [isInCombat, setIsInCombat] = useState(false);
    const [turnOrder, setTurnOrder] = useState<(Token & { initiative: number })[]>([]);
    const [activeTokenIndex, setActiveTokenIndex] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);


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
            
            // Resolve map URL if it's a reference
            if (activeScene) {
                const mapUrl = activeScene.background_map_url;
                if (mapUrl.startsWith('map_')) {
                    try {
                        const mapsJSON = localStorage.getItem(STORAGE_KEY_MAPS);
                        const maps = mapsJSON ? JSON.parse(mapsJSON) : {};
                        if (maps[mapUrl]) {
                            activeScene.background_map_url = maps[mapUrl];
                        } else {
                            // Fallback if map data is missing
                            activeScene.background_map_url = 'https://placehold.co/1200x800.png';
                            toast({ variant: "destructive", title: "Map Missing", description: "The map image for this scene could not be found." });
                        }
                    } catch (e) {
                        console.error("Failed to load scene map:", e);
                        activeScene.background_map_url = 'https://placehold.co/1200x800.png';
                        toast({ variant: "destructive", title: "Map Load Error", description: "There was an error loading the map image." });
                    }
                }
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

    const handleStartCombat = () => {
        if (!scene) return;

        const combatants = scene.tokens.map(token => {
            const isPlayer = token.type === 'character';
            const characterData = isPlayer ? allPlayerCharacters.find(pc => pc.id === token.linked_character_id) : null;
            const enemyData = !isPlayer ? allEnemies.find(e => e.id === token.linked_enemy_id) : null;
            
            const dex = (isPlayer ? characterData?.stats.dex : enemyData?.dex) || 10;
            const dexMod = Math.floor((dex - 10) / 2);
            const initiative = Math.floor(Math.random() * 20) + 1 + dexMod;

            return { ...token, initiative };
        });

        combatants.sort((a, b) => b.initiative - a.initiative);

        setTurnOrder(combatants);
        setActiveTokenIndex(0);
        setRoundNumber(1);
        setIsInCombat(true);
        setSelectedToken(combatants[0]);
        setIsActionPanelOpen(true);

        toast({
            title: "Combat Started!",
            description: "Initiative has been rolled. The battle begins!"
        });
    };

    const handleEndTurn = () => {
        const nextIndex = (activeTokenIndex + 1);
        let newRoundNumber = roundNumber;
        let finalIndex = nextIndex;

        if (nextIndex >= turnOrder.length) {
            finalIndex = 0;
            newRoundNumber += 1;
            setRoundNumber(newRoundNumber);
            toast({ title: `Round ${newRoundNumber}`, description: "A new round has begun."});
        }
        
        setActiveTokenIndex(finalIndex);
        setSelectedToken(turnOrder[finalIndex]);
        setIsActionPanelOpen(true);
    };

    const handleEndCombat = () => {
        setIsInCombat(false);
        setTurnOrder([]);
        setActiveTokenIndex(0);
        setRoundNumber(1);
        toast({ title: "Combat Ended" });
    };
    
    const handleTokenClick = (token: Token) => {
        setSelectedToken(token);
        setIsActionPanelOpen(true);
    };

    const handleTokenMouseDown = (e: React.MouseEvent<HTMLDivElement>, tokenId: string) => {
        // Only drag with left click
        if (e.button !== 0) return;

        if (isInCombat && tokenId !== turnOrder[activeTokenIndex]?.id) {
            toast({ variant: 'destructive', title: "Not their turn!", description: "You can only move the active creature." });
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const tokenElement = e.currentTarget;
        const rect = tokenElement.getBoundingClientRect();
        
        // Offset from the center of the token in screen pixels
        const tokenCenterX = rect.left + rect.width / 2;
        const tokenCenterY = rect.top + rect.height / 2;
        const offsetX = e.clientX - tokenCenterX;
        const offsetY = e.clientY - tokenCenterY;
        
        setDraggedToken({ id: tokenId, offsetX, offsetY });
    };

    const handleInteractionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Pan with right click
        if (e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };
    
    const handleInteractionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            e.preventDefault();
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
            return;
        }

        if (draggedToken && mapInteractionRef.current && scene) {
            e.preventDefault();
            
            if (isInCombat && draggedToken.id !== turnOrder[activeTokenIndex]?.id) {
                return;
            }

            const containerRect = mapInteractionRef.current.getBoundingClientRect();
            
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;

            const mapX = (mouseX - pan.x) / zoom;
            const mapY = (mouseY - pan.y) / zoom;
            
            const newX = mapX - (draggedToken.offsetX / zoom);
            const newY = mapY - (draggedToken.offsetY / zoom);

            let newXPercent = (newX / mapInteractionRef.current.offsetWidth) * 100;
            let newYPercent = (newY / mapInteractionRef.current.offsetHeight) * 100;

            // --- SNAPPING LOGIC ---
            const cellWidthPercent = 100 / (scene.width || 30);
            const cellHeightPercent = 100 / (scene.height || 20);

            const halfCellWidth = cellWidthPercent / 2;
            const halfCellHeight = cellHeightPercent / 2;

            // Find the nearest half-cell multiple for snapping
            newXPercent = Math.round(newXPercent / halfCellWidth) * halfCellWidth;
            newYPercent = Math.round(newYPercent / halfCellHeight) * halfCellHeight;
            // --- END SNAPPING LOGIC ---
            
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
        }
    };
    
    const handleInteractionMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggedToken && e.button === 0) {
            if (scene) {
                saveCampaignChanges(scene);
            }
            setDraggedToken(null);
        }
        
        if (isPanning && e.button === 2) {
            setIsPanning(false);
        }
    };
    
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!mapInteractionRef.current) return;

        const rect = mapInteractionRef.current.getBoundingClientRect();
        const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.2, Math.min(5, zoom + scrollDelta * zoom));

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const mapX = (mouseX - pan.x) / zoom;
        const mapY = (mouseY - pan.y) / zoom;

        const newPanX = mouseX - mapX * newZoom;
        const newPanY = mouseY - mapY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
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

                {isInCombat && (
                    <TurnOrderTracker 
                        turnOrder={turnOrder}
                        activeTokenIndex={activeTokenIndex}
                        roundNumber={roundNumber}
                    />
                )}
                
                {/* Map Area */}
                <div 
                    ref={mapInteractionRef}
                    className="flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg select-none"
                    onMouseDown={handleInteractionMouseDown}
                    onMouseMove={handleInteractionMouseMove}
                    onMouseUp={handleInteractionMouseUp}
                    onMouseLeave={handleInteractionMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={handleContextMenu}
                >
                    <div
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: '0 0',
                            cursor: isPanning ? 'grabbing' : 'default',
                        }}
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

                                const activeTokenIdInCombat = isInCombat ? turnOrder[activeTokenIndex]?.id : null;

                                return (
                                    <Tooltip key={token.id}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "absolute group transition-opacity",
                                                    isInCombat && activeTokenIdInCombat !== token.id && "opacity-70",
                                                    isInCombat && activeTokenIdInCombat === token.id && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background rounded-full z-10"
                                                )}
                                                style={{
                                                    left: `${token.position.x}%`,
                                                    top: `${token.position.y}%`,
                                                    width: `${tokenWidth}%`,
                                                    height: `${tokenHeight}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    cursor: (draggedToken?.id === token.id) || (isInCombat && activeTokenIdInCombat === token.id) ? 'grabbing' : 'grab',
                                                }}
                                                onClick={() => handleTokenClick(token)}
                                                onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
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
                 <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    {!isInCombat ? (
                        <Button size="lg" onClick={handleStartCombat}>
                            <Swords className="mr-2" />
                            Start Combat
                        </Button>
                    ) : (
                        <>
                            <Button size="lg" variant="destructive" onClick={handleEndCombat}>
                                <ShieldCross className="mr-2" />
                                End Combat
                            </Button>
                            <Button size="lg" onClick={handleEndTurn}>
                                End Turn
                            </Button>
                        </>
                    )}
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
