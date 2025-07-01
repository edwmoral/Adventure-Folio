
'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid, Maximize, Minimize, Swords, ShieldClose, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Campaign, Scene, Token, PlayerCharacter, Enemy, Action, MonsterAction, Spell } from '@/lib/types';
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
const STORAGE_KEY_SPELLS = 'dnd_spells';

type Combatant = Token & {
    initiative: number;
    speed: number;
    movementRemaining: number;
    hasAction: boolean;
    hasBonusAction: boolean;
    statusEffects: ('dodging')[];
};

type TargetingState = {
    type: 'attack' | 'spell';
    actor: Combatant;
    spell?: Spell;
    range: number;
    aoe?: { shape: string; size: number };
} | null;

export default function MapViewPage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const [resolvedMapUrl, setResolvedMapUrl] = useState<string>('');
    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
    const [allActions, setAllActions] = useState<Action[]>([]);
    const [allSpells, setAllSpells] = useState<Spell[]>([]);
    const [loading, setLoading] = useState(true);

    const mapInteractionRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const [draggedToken, setDraggedToken] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
    const [dragDistance, setDragDistance] = useState(0);
    
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // --- Combat & Targeting State ---
    const [isInCombat, setIsInCombat] = useState(false);
    const [turnOrder, setTurnOrder] = useState<Combatant[]>([]);
    const [activeTokenIndex, setActiveTokenIndex] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);
    
    const [targeting, setTargeting] = useState<TargetingState>(null);

    const [mouseMapPos, setMouseMapPos] = useState<{ x: number, y: number } | null>(null);


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
            
            if (activeScene) {
                let mapUrl = activeScene.background_map_url;
                if (mapUrl.startsWith('map_')) {
                    try {
                        const mapsJSON = localStorage.getItem(STORAGE_KEY_MAPS);
                        const maps = mapsJSON ? JSON.parse(mapsJSON) : {};
                        if (maps[mapUrl]) {
                            setResolvedMapUrl(maps[mapUrl]);
                        } else {
                            setResolvedMapUrl('https://placehold.co/1200x800.png');
                            toast({ variant: "destructive", title: "Map Missing", description: "The map image for this scene could not be found." });
                        }
                    } catch (e) {
                        console.error("Failed to load scene map:", e);
                        setResolvedMapUrl('https://placehold.co/1200x800.png');
                        toast({ variant: "destructive", title: "Map Load Error", description: "There was an error loading the map image." });
                    }
                } else {
                    setResolvedMapUrl(mapUrl);
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

            const storedSpells = localStorage.getItem(STORAGE_KEY_SPELLS);
            if (storedSpells) setAllSpells(JSON.parse(storedSpells));

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

        const combatants: Combatant[] = scene.tokens.map(token => {
            const isPlayer = token.type === 'character';
            const characterData = isPlayer ? allPlayerCharacters.find(pc => pc.id === token.linked_character_id) : null;
            const enemyData = !isPlayer ? allEnemies.find(e => e.id === token.linked_enemy_id) : null;
            
            const dex = (isPlayer ? characterData?.stats.dex : enemyData?.dex) || 10;
            const dexMod = Math.floor((dex - 10) / 2);
            const initiative = Math.floor(Math.random() * 20) + 1 + dexMod;
            const speedInFt = isPlayer ? 30 : (enemyData?.speed.match(/\d+/)?.[0] || 30);

            return { 
                ...token, 
                initiative,
                speed: Number(speedInFt),
                movementRemaining: Number(speedInFt),
                hasAction: true,
                hasBonusAction: true,
                statusEffects: [],
            };
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
        
        const newTurnOrder = turnOrder.map((c, i) => {
            if (i === finalIndex) {
                return {
                    ...c,
                    movementRemaining: c.speed,
                    hasAction: true,
                    hasBonusAction: true,
                    statusEffects: c.statusEffects?.filter(e => e !== 'dodging'),
                };
            }
            return c;
        });
        setTurnOrder(newTurnOrder);
        
        setActiveTokenIndex(finalIndex);
        setSelectedToken(newTurnOrder[finalIndex]);
        setIsActionPanelOpen(true);
    };

    const handleEndCombat = () => {
        setIsInCombat(false);
        setTurnOrder([]);
        setActiveTokenIndex(0);
        setRoundNumber(1);
        toast({ title: "Combat Ended" });
    };

    const resolveAttack = (target: Token) => {
        if (!targeting || targeting.type !== 'attack') return;
        const { actor } = targeting;

        const attackerData = actor.type === 'character' 
            ? allPlayerCharacters.find(c => c.id === actor.linked_character_id) 
            : allEnemies.find(e => e.id === actor.linked_enemy_id);
        const targetData = target.type === 'character' 
            ? allPlayerCharacters.find(c => c.id === target.linked_character_id) 
            : allEnemies.find(e => e.id === target.linked_enemy_id);
        
        if (!attackerData || !targetData) return;

        const getModifierValue = (score: number) => Math.floor((score - 10) / 2);
        const getProficiencyBonus = (level: number) => Math.ceil(1 + level / 4);
        const getMonsterProficiency = (cr: string) => {
            try {
                const crNum = eval(cr);
                if (crNum < 5) return 2; if (crNum < 9) return 3; if (crNum < 13) return 4; if (crNum < 17) return 5; return 6;
            } catch { return 2; }
        };

        const defenderAC = parseInt(String(targetData.ac));
        const attackerProficiency = actor.type === 'character' ? getProficiencyBonus((attackerData as PlayerCharacter).level) : getMonsterProficiency((attackerData as Enemy).cr);
        const strMod = getModifierValue(attackerData.str);
        const attackBonus = strMod + attackerProficiency;

        const targetCombatant = turnOrder.find(c => c.id === target.id);
        const hasDisadvantage = targetCombatant?.statusEffects.includes('dodging') || false;

        const d20_1 = Math.floor(Math.random() * 20) + 1;
        let attackRoll = d20_1;
        let rollDescription = `Rolled ${d20_1}`;

        if (hasDisadvantage) {
            const d20_2 = Math.floor(Math.random() * 20) + 1;
            attackRoll = Math.min(d20_1, d20_2);
            rollDescription = `Rolled ${d20_1}, ${d20_2} (disadvantage) -> ${attackRoll}`;
        }
        
        const totalAttack = attackRoll + attackBonus;
        toast({ title: "Attack Roll", description: `${rollDescription} + ${attackBonus} = ${totalAttack} vs AC ${defenderAC}` });

        if (totalAttack >= defenderAC || attackRoll === 20) {
            const damageRoll = Math.floor(Math.random() * 8) + 1;
            const totalDamage = Math.max(1, damageRoll + strMod);
            const currentHp = target.hp ?? (targetData.type === 'Humanoid' ? (targetData as PlayerCharacter).hp : parseInt((targetData as Enemy).hp.split(' ')[0]));
            const newHp = currentHp - totalDamage;

            const newTurnOrder = turnOrder.map(c => c.id === target.id ? { ...c, hp: newHp } : c);
            setTurnOrder(newTurnOrder);
            
            if (scene) {
                const newScene = { ...scene, tokens: scene.tokens.map(t => t.id === target.id ? { ...t, hp: newHp } : t) };
                setScene(newScene);
                saveCampaignChanges(newScene);
            }
            
            toast({ title: "HIT!", description: `${actor.name} hits ${target.name} for ${totalDamage} damage!` });
        } else {
            toast({ title: "MISS!", description: `${actor.name} missed ${target.name}.` });
        }
        
        handleUseAction('action');
        setTargeting(null);
    };

    const resolveSpellOnToken = (targetToken: Token) => {
        if (!targeting || targeting.type !== 'spell' || !scene) return;
        const { actor, spell, range } = targeting;

        // Check range
        const rangeInPercent = range / 5 * (100 / (scene.width || 30));
        const dist = Math.hypot(targetToken.position.x - actor.position.x, targetToken.position.y - actor.position.y);
        if (dist > rangeInPercent) {
            toast({ variant: 'destructive', title: 'Out of Range', description: `Target is too far away.` });
            return;
        }

        // Logic for what the spell does can be added here (e.g., damage, effects)
        // For now, a simple notification.
        toast({ title: "Spell Cast!", description: `${actor.name} casts ${spell.name} on ${targetToken.name}.` });

        if (isInCombat) handleUseAction('action'); // Assumes all spells are an action. Could be improved.
        setTargeting(null);
    };

    const cancelTargeting = () => {
        if (!targeting) return;
        toast({ title: `${targeting.type === 'attack' ? 'Attack' : 'Spell'} Cancelled` });
        setTargeting(null);
    }
    
    const handleTokenClick = (e: React.MouseEvent<HTMLDivElement>, token: Token) => {
        e.stopPropagation();
        
        if (targeting) {
             if (targeting.actor && token.id === targeting.actor.id) {
                toast({ variant: 'destructive', title: 'Invalid Target', description: "You cannot target yourself." });
                return;
            }
            if (targeting.type === 'attack') {
                resolveAttack(token);
            }
            if (targeting.type === 'spell') {
                // AoE spells are resolved by clicking the map, not a token.
                if (targeting.aoe) {
                     toast({ variant: 'destructive', title: 'Invalid Action', description: 'For Area of Effect spells, click on the map to set the center point.' });
                     return;
                }
                resolveSpellOnToken(token);
            }
        } else {
            if (isInCombat && token.id !== turnOrder[activeTokenIndex]?.id) {
                toast({ variant: 'destructive', title: "Not their turn!", description: `It is currently ${turnOrder[activeTokenIndex]?.name}'s turn.` });
                return;
            }
            setSelectedToken(token);
            setIsActionPanelOpen(true);
        }
    };
    
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!targeting || !mouseMapPos || !scene) return;

        // Spells with an area of effect are cast on the map
        if (targeting.type === 'spell' && targeting.aoe) {
            const { range, actor, spell } = targeting;
            const dist = Math.hypot(mouseMapPos.x - actor.position.x, mouseMapPos.y - actor.position.y);
            const rangeInPercent = range / 5 * (100 / (scene.width || 30));

            if (dist > rangeInPercent) {
                toast({ variant: 'destructive', title: 'Out of Range', description: `Target is too far away.` });
                return;
            }

            toast({ title: "Spell Cast!", description: `You cast ${spell?.name || 'a spell'}.` });
            if (isInCombat) handleUseAction('action');
            setTargeting(null);
        }
    };

    const handleTokenMouseDown = (e: React.MouseEvent<HTMLDivElement>, tokenId: string) => {
        if (e.button !== 0 || targeting) return;

        if (isInCombat && tokenId !== turnOrder[activeTokenIndex]?.id) {
            toast({ variant: 'destructive', title: "Not their turn!", description: "You can only move the active creature." });
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const tokenElement = e.currentTarget;
        const rect = tokenElement.getBoundingClientRect();
        
        const tokenCenterX = rect.left + rect.width / 2;
        const tokenCenterY = rect.top + rect.height / 2;
        const offsetX = e.clientX - tokenCenterX;
        const offsetY = e.clientY - tokenCenterY;
        
        setDragDistance(0);
        setDragStartPos(scene?.tokens.find(t => t.id === tokenId)?.position || null);
        setDraggedToken({ id: tokenId, offsetX, offsetY });
    };

    const handleInteractionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 2) {
            e.preventDefault();
            if (targeting) return;
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };
    
    const handleInteractionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            e.preventDefault();
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }
        
        if (!mapInteractionRef.current || !scene) return;
        
        const containerRect = mapInteractionRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        const mapX = (mouseX - pan.x) / zoom;
        const mapY = (mouseY - pan.y) / zoom;
        const newXPercent = (mapX / mapInteractionRef.current.offsetWidth) * 100;
        const newYPercent = (mapY / mapInteractionRef.current.offsetHeight) * 100;
        setMouseMapPos({ x: newXPercent, y: newYPercent });

        if (draggedToken && dragStartPos) {
            e.preventDefault();
            
            if (isInCombat && draggedToken.id !== turnOrder[activeTokenIndex]?.id) return;

            const newX = mapX - (draggedToken.offsetX / zoom);
            const newY = mapY - (draggedToken.offsetY / zoom);

            let newXSnappedPercent = (newX / mapInteractionRef.current.offsetWidth) * 100;
            let newYSmappedPercent = (newY / mapInteractionRef.current.offsetHeight) * 100;
            const cellWidthPercent = 100 / (scene.width || 30);
            const cellHeightPercent = 100 / (scene.height || 20);
            const halfCellWidth = cellWidthPercent / 2;
            const halfCellHeight = cellHeightPercent / 2;
            newXSnappedPercent = Math.round(newXSnappedPercent / halfCellWidth) * halfCellWidth;
            newYSmappedPercent = Math.round(newYSmappedPercent / halfCellHeight) * halfCellHeight;
            newXSnappedPercent = Math.max(0, Math.min(100, newXSnappedPercent));
            newYSmappedPercent = Math.max(0, Math.min(100, newYSmappedPercent));
            
            const startGridX = Math.floor(dragStartPos.x / cellWidthPercent);
            const startGridY = Math.floor(dragStartPos.y / cellHeightPercent);
            const currentGridX = Math.floor(newXSnappedPercent / cellWidthPercent);
            const currentGridY = Math.floor(newYSmappedPercent / cellHeightPercent);
            const distanceMoved = Math.max(Math.abs(currentGridX - startGridX), Math.abs(currentGridY - startGridY)) * 5;
            setDragDistance(distanceMoved);

            setScene(prevScene => {
                if (!prevScene) return null;
                return {
                    ...prevScene,
                    tokens: prevScene.tokens.map(token => 
                        token.id === draggedToken.id 
                            ? { ...token, position: { x: newXSnappedPercent, y: newYSmappedPercent } } 
                            : token
                    )
                };
            });
        }
    };
    
    const handleInteractionMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning && e.button === 2) {
            setIsPanning(false);
        }

        if (draggedToken && e.button === 0 && scene && dragStartPos) {
            const finalToken = scene.tokens.find(t => t.id === draggedToken.id);
            if (!finalToken) return;

            const cellWidthPercent = 100 / (scene.width || 30);
            const finalGridX = Math.floor(finalToken.position.x / cellWidthPercent);
            const finalGridY = Math.floor(finalToken.position.y / cellWidthPercent);
            const startGridX = Math.floor(dragStartPos.x / cellWidthPercent);
            const startGridY = Math.floor(dragStartPos.y / cellWidthPercent);
            const distanceMoved = Math.max(Math.abs(finalGridX - startGridX), Math.abs(finalGridY - startGridY)) * 5;
            
            const activeCombatant = turnOrder[activeTokenIndex];
            
            if (isInCombat && distanceMoved > activeCombatant.movementRemaining) {
                toast({ variant: 'destructive', title: "Not enough movement!", description: `Cannot move ${distanceMoved}ft.`});
                setScene(prevScene => {
                    if (!prevScene) return null;
                    return { ...prevScene, tokens: prevScene.tokens.map(t => t.id === draggedToken.id ? { ...t, position: dragStartPos } : t) };
                });
            } else {
                if (isInCombat) {
                    setTurnOrder(prev => prev.map((c, i) => i === activeTokenIndex ? { ...c, movementRemaining: c.movementRemaining - distanceMoved, position: finalToken.position } : c));
                }
                saveCampaignChanges(scene);
            }
            
            setDraggedToken(null);
            setDragStartPos(null);
            setDragDistance(0);
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
        if (targeting) cancelTargeting();
    };

    const toggleFullscreen = () => {
        const element = fullscreenContainerRef.current;
        if (!element) return;
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => toast({ variant: "destructive", title: "Fullscreen Error", description: `Could not enter full-screen mode: ${err.message}` }));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleUseAction = (type: 'action' | 'bonus') => {
        setTurnOrder(prev => prev.map((c, i) => {
            if (i === activeTokenIndex) {
                return { ...c, hasAction: type === 'action' ? false : c.hasAction, hasBonusAction: type === 'bonus' ? false : c.hasBonusAction };
            }
            return c;
        }));
    };

    const handleDash = () => {
        if (!turnOrder[activeTokenIndex]?.hasAction) {
            toast({ variant: 'destructive', title: 'No Action', description: 'You have already used your action this turn.' });
            return;
        }
        handleUseAction('action');
        setTurnOrder(prev => prev.map((c, i) => i === activeTokenIndex ? { ...c, movementRemaining: c.movementRemaining + c.speed } : c));
        toast({ title: 'Dashed!', description: 'You gain extra movement for this turn.' });
    };

    const handleDodge = () => {
        const activeCombatant = turnOrder[activeTokenIndex];
        if (!activeCombatant?.hasAction) {
            toast({ variant: 'destructive', title: 'No Action', description: 'You have already used your action this turn.'});
            return;
        }
        handleUseAction('action');
        setTurnOrder(prev => prev.map((c, i) => i === activeTokenIndex ? { ...c, statusEffects: ['dodging'] } : c));
        toast({ title: 'Dodging!', description: `${activeCombatant.name} will be harder to hit until their next turn.`});
    };

    const handleAttack = () => {
        const activeCombatant = turnOrder[activeTokenIndex];
        if (!activeCombatant) return;
        if (!activeCombatant.hasAction) {
            toast({ variant: 'destructive', title: 'No Action', description: 'You have already used your action this turn.'});
            return;
        }
        setTargeting({ type: 'attack', actor: activeCombatant, range: 5 });
        setIsActionPanelOpen(false);
        toast({ title: 'Select a Target', description: 'Click on a creature to attack. Right-click to cancel.'});
    };
    
    // --- Spellcasting ---
    const parseSpellRange = (rangeStr: string): number => {
        if (rangeStr.toLowerCase() === 'self' || rangeStr.toLowerCase() === 'touch') return 5; // Treat as melee
        const match = rangeStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    const parseSpellAoe = (spell: Spell): { shape: string, size: number } | undefined => {
        if (spell.aoe) {
            return { shape: spell.aoe.shape, size: spell.aoe.size };
        }
        const radiusMatch = spell.text.match(/(\d+)-foot-radius/i);
        if (radiusMatch) return { shape: 'sphere', size: parseInt(radiusMatch[1]) };
        return undefined;
    };

    const handleInitiateSpellcast = (spell: Spell) => {
        if (!selectedToken || !scene) return;

        let actor: Combatant;

        if (isInCombat) {
            const combatant = turnOrder.find(c => c.id === selectedToken.id);
            if (!combatant) {
                toast({ variant: "destructive", title: "Error", description: "Could not find the spellcaster in the turn order." });
                return;
            }
            if (!combatant.hasAction) {
                toast({ variant: 'destructive', title: 'No Action', description: 'You have already used your action this turn.'});
                return;
            }
            actor = combatant;
        } else {
            // Not in combat, create a temporary combatant object for targeting visuals
            const characterData = allPlayerCharacters.find(pc => pc.id === selectedToken.linked_character_id);
            const enemyData = allEnemies.find(e => e.id === selectedToken.linked_enemy_id);
            const speedInFt = selectedToken.type === 'character' ? 30 : (enemyData?.speed.match(/\d+/)?.[0] || 30);

            actor = {
                ...selectedToken,
                initiative: 0,
                speed: Number(speedInFt),
                movementRemaining: Number(speedInFt),
                hasAction: true,
                hasBonusAction: true,
                statusEffects: [],
            };
        }
        
        const range = parseSpellRange(spell.range);
        const aoe = parseSpellAoe(spell);
        
        setTargeting({ type: 'spell', actor, spell, range, aoe });
        setIsActionPanelOpen(false); // Hide the panel to see the map
        toast({ title: `Casting ${spell.name}`, description: 'Select a target or point on the map. Right-click to cancel.' });
    };


    if (loading) return <div className="text-center p-8">Loading scene...</div>;

    if (!scene) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-semibold">No active scene found</h2>
                <p className="text-muted-foreground">Go to the campaign settings to activate a scene.</p>
                 <Button asChild variant="ghost" className="mt-4">
                    <Link href={`/play/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaign
                    </Link>
                </Button>
            </div>
        );
    }

    const activeCombatant = isInCombat ? turnOrder[activeTokenIndex] : null;
    const actorToken = targeting ? scene.tokens.find(t => t.id === targeting.actor.id) : null;

    return (
        <TooltipProvider>
            <div ref={fullscreenContainerRef} className="h-[calc(100vh-10rem)] w-full flex flex-col bg-background">
                {/* Header Controls */}
                <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm p-2 border-b rounded-t-lg flex items-center justify-between">
                    <div>
                         <Button asChild variant="ghost">
                            <Link href={`/play/${id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaign
                            </Link>
                        </Button>
                    </div>
                     <h2 className="text-lg font-semibold">Active Scene: {scene.name}</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z * 1.2, 5))}><ZoomIn /></Button>
                        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}><ZoomOut /></Button>
                        <Button variant="outline" size="icon" onClick={() => setShowGrid(p => !p)}><Grid /></Button>
                        <Button variant="outline" size="icon" onClick={toggleFullscreen}>{isFullscreen ? <Minimize /> : <Maximize />}</Button>
                    </div>
                </div>

                {isInCombat && <TurnOrderTracker turnOrder={turnOrder} activeTokenIndex={activeTokenIndex} roundNumber={roundNumber} />}
                
                <div ref={mapInteractionRef} className={cn("flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg select-none", targeting && "cursor-crosshair")} onMouseDown={handleInteractionMouseDown} onMouseMove={handleInteractionMouseMove} onMouseUp={handleInteractionMouseUp} onMouseLeave={handleInteractionMouseUp} onWheel={handleWheel} onContextMenu={handleContextMenu} onClick={handleMapClick}>
                    <div className="absolute top-0 left-0 w-full h-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', cursor: isPanning ? 'grabbing' : 'default' }}>
                        <div className="relative w-full h-full" style={{ aspectRatio: `${scene.width || 30}/${scene.height || 20}` }}>
                            {resolvedMapUrl && <Image src={resolvedMapUrl} alt="Fantasy battle map" fill className="object-cover" data-ai-hint="fantasy map" draggable="false" />}
                            {showGrid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundSize: `${100 / (scene.width || 30)}% ${100 / (scene.height || 20)}%`, backgroundImage: 'linear-gradient(to right, hsla(var(--border) / 0.75) 1px, transparent 1px), linear-gradient(to bottom, hsla(var(--border) / 0.75) 1px, transparent 1px)' }} />}
                            
                            {/* TARGETING INDICATORS */}
                            {targeting && actorToken && scene && (() => {
                                const rangeInPercent = (targeting.range / 5) * (100 / (scene.width || 30));
                                
                                return (
                                    <>
                                        {/* Max Range Indicator */}
                                        <div
                                            className="absolute bg-blue-500/10 border border-blue-400/50 rounded-full pointer-events-none"
                                            style={{
                                                width: `${rangeInPercent * 2}%`,
                                                height: `${rangeInPercent * 2}%`,
                                                left: `${actorToken.position.x}%`,
                                                top: `${actorToken.position.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />

                                        {/* AoE Indicator (follows mouse) */}
                                        {targeting.type === 'spell' && targeting.aoe && mouseMapPos && (() => {
                                            const feetToPercentX = (feet: number) => (feet / 5) * (100 / (scene.width || 30));
                                            const feetToPercentY = (feet: number) => (feet / 5) * (100 / (scene.height || 20));
                                            const { shape, size } = targeting.aoe;

                                            const style: React.CSSProperties = {
                                                position: 'absolute',
                                                left: `${mouseMapPos.x}%`,
                                                top: `${mouseMapPos.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                pointerEvents: 'none',
                                                backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.2)',
                                                border: '1px solid hsl(0, 84.2%, 60.2%)',
                                            };

                                            if (shape === 'sphere' || shape === 'cylinder') {
                                                style.width = `${feetToPercentX(size) * 2}%`;
                                                style.height = `${feetToPercentY(size) * 2}%`;
                                                style.borderRadius = '9999px';
                                            } else if (shape === 'cube') {
                                                style.width = `${feetToPercentX(size)}%`;
                                                style.height = `${feetToPercentY(size)}%`;
                                            } else {
                                                return null;
                                            }

                                            return <div style={style} />;
                                        })()}
                                        
                                        {/* Dotted targeting line */}
                                        {mouseMapPos && (() => {
                                            const dist = Math.hypot(
                                                mouseMapPos.x - actorToken.position.x,
                                                mouseMapPos.y - actorToken.position.y
                                            );
                                            
                                            if (dist > rangeInPercent) {
                                                return null;
                                            }

                                            return (
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                                    <line 
                                                        x1={`${actorToken.position.x}%`} 
                                                        y1={`${actorToken.position.y}%`} 
                                                        x2={`${mouseMapPos.x}%`} 
                                                        y2={`${mouseMapPos.y}%`} 
                                                        stroke="hsl(var(--destructive))" 
                                                        strokeWidth={2 / zoom} 
                                                        strokeDasharray="5 5"
                                                    />
                                                </svg>
                                            )
                                        })()}
                                    </>
                                );
                            })()}

                            {/* MOVEMENT RANGE INDICATOR */}
                            {isInCombat && activeCombatant && !draggedToken && !targeting && (() => {
                                const visualTokenForActiveCombatant = scene.tokens.find(t => t.id === activeCombatant.id);
                                if (!visualTokenForActiveCombatant) return null;
                                const movementRadius = Math.floor(activeCombatant.movementRemaining / 5) * (100 / (scene.width || 30));
                                return (
                                    <div
                                        className="absolute bg-blue-500/20 border border-blue-400 rounded-full pointer-events-none"
                                        style={{
                                            width: `${movementRadius * 2}%`, height: `${movementRadius * 2}%`,
                                            left: `${visualTokenForActiveCombatant.position.x}%`, top: `${visualTokenForActiveCombatant.position.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })()}
                            
                            {/* DRAG INDICATORS */}
                            {draggedToken && dragStartPos && scene && (
                                <div className="absolute inset-0 w-full h-full pointer-events-none">
                                    <div className="absolute bg-black/30 border-2 border-dashed border-white" style={{ left: `${dragStartPos.x}%`, top: `${dragStartPos.y}%`, width: `${100 / (scene.width || 30)}%`, height: `${100 / (scene.height || 20)}%`, transform: 'translate(-50%, -50%)' }} />
                                    <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                                        <line x1={`${dragStartPos.x}%`} y1={`${dragStartPos.y}%`} x2={`${scene.tokens.find(t => t.id === draggedToken.id)?.position.x}%`} y2={`${scene.tokens.find(t => t.id === draggedToken.id)?.position.y}%`} stroke="white" strokeWidth={2 / zoom} strokeDasharray="4 4" strokeLinecap="round" />
                                        {dragDistance > 0 && <text x={`${(dragStartPos.x + (scene.tokens.find(t => t.id === draggedToken.id)?.position.x || dragStartPos.x)) / 2}%`} y={`${(dragStartPos.y + (scene.tokens.find(t => t.id === draggedToken.id)?.position.y || dragStartPos.y)) / 2}%`} fill="white" stroke="black" strokeWidth={0.5 / zoom} style={{ fontSize: `${14 / zoom}px`, paintOrder: 'stroke', fontWeight: 'bold' }} textAnchor="middle" dominantBaseline="bottom" dy={-4 / zoom}>{dragDistance}ft</text>}
                                    </svg>
                                </div>
                            )}
                            
                            {scene.tokens.map(token => {
                                const isPlayer = token.type === 'character';
                                const playerChar = isPlayer ? allPlayerCharacters.find(pc => pc.id === token.linked_character_id) : null;
                                const enemy = !isPlayer ? allEnemies.find(e => e.id === token.linked_enemy_id) : null;
                                const health = token.hp ?? (isPlayer ? playerChar?.hp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
                                const maxHealth = token.maxHp ?? (isPlayer ? playerChar?.maxHp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
                                const ac = isPlayer ? playerChar?.ac : (enemy ? parseInt(enemy.ac) : undefined);
                                const healthPercent = (health !== undefined && maxHealth) ? (health / maxHealth) * 100 : 100;
                                const tokenWidth = 100 / (scene.width || 30);
                                const tokenHeight = 100 / (scene.height || 20);
                                const activeTokenIdInCombat = isInCombat ? turnOrder[activeTokenIndex]?.id : null;
                                const isDodging = isInCombat && turnOrder.find(c => c.id === token.id)?.statusEffects?.includes('dodging');
                                const borderColor = isPlayer ? (playerChar?.tokenBorderColor || 'hsl(var(--primary))') : 'hsl(var(--destructive))';
                                
                                return (
                                    <Tooltip key={token.id}>
                                        <TooltipTrigger asChild>
                                            <div className={cn("absolute group transition-opacity", isInCombat && activeTokenIdInCombat !== token.id && "opacity-70", isInCombat && activeTokenIdInCombat === token.id && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background rounded-full z-10")} style={{ left: `${token.position.x}%`, top: `${token.position.y}%`, width: `${tokenWidth}%`, height: `${tokenHeight}%`, transform: 'translate(-50%, -50%)', cursor: (draggedToken?.id === token.id) || (isInCombat && activeTokenIdInCombat === token.id) ? 'grabbing' : 'grab' }} onClick={(e) => handleTokenClick(e, token)} onMouseDown={(e) => handleTokenMouseDown(e, token.id)}>
                                                <div className="relative w-full h-full flex flex-col items-center justify-center p-[5%]">
                                                    {isDodging && <Shield className="absolute -top-1 -right-1 h-4 w-4 text-blue-400 bg-background rounded-full p-0.5 z-10" />}
                                                    {maxHealth && <Progress value={healthPercent} className={cn("absolute -top-1 w-full h-1", isPlayer ? "bg-green-900/50 [&>div]:bg-green-500" : "bg-red-900/50 [&>div]:bg-red-500")} />}
                                                    <Avatar className="h-full w-full border-4 shadow-lg transition-transform group-hover:scale-105" style={{ borderColor }}>
                                                        <AvatarImage src={token.imageUrl} className="object-cover" data-ai-hint="fantasy character icon" />
                                                        <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><div className="space-y-1 text-sm text-left"><p className="font-bold">{token.name}</p>{health !== undefined && maxHealth && <p>HP: {health} / {maxHealth}</p>}{ac !== undefined && <p>AC: {ac} 🛡️</p>}{isPlayer && playerChar?.spell_slots && Object.keys(playerChar.spell_slots).length > 0 && (<div className="pt-1 mt-1 border-t border-border/50"><p className="font-semibold text-xs mb-1">Spell Slots</p><div className="space-y-0.5">{Object.entries(playerChar.spell_slots).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, slots]) => (<p key={level} className="text-xs text-muted-foreground">Lvl {level}: {slots.current} / {slots.max}</p>))}</div></div>)}</div></TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                </div>
                 <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    {!isInCombat ? <Button size="lg" onClick={handleStartCombat}><Swords className="mr-2" /> Start Combat</Button> : (<><Button size="lg" variant="destructive" onClick={handleEndCombat}><ShieldClose className="mr-2" /> End Combat</Button><Button size="lg" onClick={handleEndTurn}>End Turn</Button></>)}
                </div>
                 <ActionPanel open={isActionPanelOpen} onOpenChange={setIsActionPanelOpen} token={selectedToken} character={selectedToken?.type === 'character' ? allPlayerCharacters.find(p => p.id === selectedToken.linked_character_id) || null : null} enemy={selectedToken?.type === 'monster' ? allEnemies.find(e => e.id === selectedToken.linked_enemy_id) || null : null} actions={allActions} allSpells={allSpells} container={fullscreenContainerRef.current} isInCombat={isInCombat} combatState={activeCombatant} onUseAction={handleUseAction} onDash={handleDash} onAttack={handleAttack} onDodge={handleDodge} onCastSpell={handleInitiateSpellcast} />
            </div>
        </TooltipProvider>
    );
}
