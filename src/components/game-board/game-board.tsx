
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Campaign, Scene, PlayerCharacter, Enemy, Class, Spell, Combatant, Action as ActionType, MonsterAction } from '@/lib/types';
import { BattleMap } from './battle-map';
import { ModulePanel } from './module-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Swords, LocateFixed } from 'lucide-react';
import { InitiativeDialog } from './initiative-dialog';
import { InitiativeTracker } from './initiative-tracker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { parseRangeFromAction } from '@/lib/action-utils';

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_ENEMIES = 'dnd_enemies';
const STORAGE_KEY_CLASSES = 'dnd_classes';
const STORAGE_KEY_SPELLS = 'dnd_spells';


export function GameBoard({ campaignId }: { campaignId: string }) {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [activeScene, setActiveScene] = useState<Scene | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('right');
    const [panelWidth, setPanelWidth] = useState(350);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const isResizing = useRef(false);

    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [allSpells, setAllSpells] = useState<Spell[]>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

    // Combat State
    const [isInCombat, setIsInCombat] = useState(false);
    const [isInitiativeDialogOpen, setIsInitiativeDialogOpen] = useState(false);
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [turnIndex, setTurnIndex] = useState(0);

    // Targeting State
    const [targetingMode, setTargetingMode] = useState<{ action: ActionType | MonsterAction, casterId: string } | null>(null);
    const { toast } = useToast();

    // Resizing Logic
    const minPanelWidth = 300;
    const maxPanelWidth = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;

    const startResizing = useCallback(() => {
        isResizing.current = true;
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
    }, []);

    const resizePanel = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing.current) {
            document.body.style.cursor = 'col-resize';
            let newWidth;
            if (panelPosition === 'right') {
                newWidth = window.innerWidth - mouseMoveEvent.clientX;
            } else {
                newWidth = mouseMoveEvent.clientX;
            }

            if (newWidth > minPanelWidth && newWidth < maxPanelWidth) {
                setPanelWidth(newWidth);
            }
        }
    }, [panelPosition, maxPanelWidth]);

    useEffect(() => {
        window.addEventListener('mousemove', resizePanel);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resizePanel);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resizePanel, stopResizing]);

    useEffect(() => {
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            if (storedCampaigns) {
                const campaigns: Campaign[] = JSON.parse(storedCampaigns);
                const currentCampaign = campaigns.find(c => c.id === campaignId);
                setCampaign(currentCampaign || null);
                if (currentCampaign) {
                    const scene = currentCampaign.scenes.find(s => s.is_active);
                    setActiveScene(scene || null);
                }
            }
            
            const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
            if (storedCharacters) setAllPlayerCharacters(JSON.parse(storedCharacters));

            const storedEnemies = localStorage.getItem(STORAGE_KEY_ENEMIES);
            if (storedEnemies) setAllEnemies(JSON.parse(storedEnemies));
            
            const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
            if (storedClasses) setAllClasses(JSON.parse(storedClasses));

            const storedSpells = localStorage.getItem(STORAGE_KEY_SPELLS);
            if (storedSpells) setAllSpells(JSON.parse(storedSpells));


        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
        setLoading(false);
    }, [campaignId]);
    
    const handleTokenSelect = (id: string | null) => {
        setSelectedTokenId(id);
        if (id && isPanelCollapsed) {
            setIsPanelCollapsed(false);
        }
        if (!id) {
            setTargetingMode(null);
        }
    };

    const handleUpdateScene = (updatedScene: Scene) => {
        if(!campaign) return;

        const updatedCampaign = {
            ...campaign,
            scenes: campaign.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)
        };
        
        setActiveScene(updatedScene);
        setCampaign(updatedCampaign);
        
        try {
            const storedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
            const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
            const updatedCampaignsList = campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaignsList));
        } catch (error) {
            console.error("Failed to save campaign:", error);
        }
    }

    const handleFocusActiveCombatant = () => {
        if (isInCombat && combatants.length > 0) {
            const activeTokenId = combatants[turnIndex]?.tokenId;
            if (activeTokenId) {
                handleTokenSelect(activeTokenId);
            }
        }
    };

    const handleCombatStart = (finalCombatants: Combatant[]) => {
        setCombatants(finalCombatants);
        setTurnIndex(0);
        setIsInCombat(true);
        setIsInitiativeDialogOpen(false);
        handleTokenSelect(finalCombatants[0]?.tokenId);
    };
    
    const handleNextTurn = () => {
        const newTurnIndex = (turnIndex + 1) % combatants.length;
        setTurnIndex(newTurnIndex);
        handleTokenSelect(combatants[newTurnIndex]?.tokenId);
    };

    const handleEndCombat = () => {
        setIsInCombat(false);
        setCombatants([]);
        setTurnIndex(0);
    };

    const handleActionActivate = useCallback((action: ActionType | MonsterAction) => {
        if (!selectedTokenId) {
            toast({ variant: 'destructive', title: 'No Caster', description: 'Select a token before activating an action.' });
            return;
        }

        const rangeInfo = parseRangeFromAction(action);
        
        // Handle actions with no range or self-range immediately
        if (!rangeInfo || (rangeInfo.type !== 'self' && rangeInfo.value === 0)) {
            toast({ title: "Action Used", description: `You used ${action.name}.` });
            return;
        }
        
        if (rangeInfo.type === 'self') {
            toast({ title: "Action Used", description: `You used ${action.name} on yourself.` });
            return;
        }

        setTargetingMode({ action, casterId: selectedTokenId });
        toast({ title: "Targeting...", description: `Select a target for ${action.name}.` });
    }, [selectedTokenId, toast]);

    const handleTargetSelect = useCallback((targetId: string) => {
        if (!targetingMode) return;

        const casterToken = activeScene?.tokens.find(t => t.id === targetingMode.casterId);
        const targetToken = activeScene?.tokens.find(t => t.id === targetId);

        if (casterToken && targetToken) {
            toast({ title: 'Action Targeted!', description: `${casterToken.name} used ${targetingMode.action.name} on ${targetToken.name}.` });
        }
        setTargetingMode(null);
    }, [targetingMode, activeScene?.tokens, toast]);

    const handleCancelTargeting = useCallback(() => {
        setTargetingMode(null);
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <p>Loading Game Board...</p>
                    <Skeleton className="h-4 w-[250px]" />
                </div>
            </div>
        );
    }

    if (!campaign || !activeScene) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center text-center p-4">
                <div>
                    <h2 className="text-xl font-bold">Error Loading Session</h2>
                    <p className="text-muted-foreground">{!campaign ? "Campaign not found." : "No active scene found for this campaign."}</p>
                </div>
            </div>
        );
    }
    
    const panelContainerClasses = "flex-shrink-0 bg-background transition-all duration-200 ease-in-out";
    const borderClass = panelPosition === 'right' ? 'border-l' : 'border-r';
    const activeCombatantId = isInCombat ? combatants[turnIndex]?.tokenId : null;

    return (
        <div className={cn("fixed inset-0 bg-muted flex", panelPosition === 'right' ? 'flex-row' : 'flex-row-reverse')}>
            <main className="flex-1 h-full bg-black relative">
                {isInCombat && (
                    <InitiativeTracker combatants={combatants} activeTurnIndex={turnIndex} />
                )}
                 <div className="absolute bottom-4 right-4 z-10">
                    {!isInCombat ? (
                        <Button onClick={() => setIsInitiativeDialogOpen(true)}>
                            <Swords className="mr-2 h-4 w-4" /> Start Combat
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-lg">
                             <Button variant="outline" size="icon" onClick={handleFocusActiveCombatant}>
                                <LocateFixed className="h-5 w-5" />
                                <span className="sr-only">Focus Active Combatant</span>
                            </Button>
                            <Button onClick={handleNextTurn}>Next Turn</Button>
                            <Button onClick={handleEndCombat} variant="destructive">End Combat</Button>
                        </div>
                    )}
                </div>
                <BattleMap 
                    scene={activeScene} 
                    onSceneUpdate={handleUpdateScene}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={handleTokenSelect}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                    isInCombat={isInCombat}
                    activeCombatantId={activeCombatantId}
                    targetingMode={targetingMode}
                    onTargetSelect={handleTargetSelect}
                    onCancelTargeting={handleCancelTargeting}
                />
            </main>
            
            {!isPanelCollapsed && (
                <div 
                    className={cn(
                        "w-1.5 h-full cursor-col-resize bg-border hover:bg-primary transition-colors",
                         panelPosition === 'left' && 'order-first'
                    )}
                    onMouseDown={startResizing}
                />
            )}
            
            <aside 
                className={cn(panelContainerClasses, borderClass, isPanelCollapsed && "w-12")}
                style={{ width: isPanelCollapsed ? undefined : panelWidth }}
            >
                <ModulePanel 
                    currentPosition={panelPosition}
                    onTogglePosition={() => setPanelPosition(p => p === 'left' ? 'right' : 'left')} 
                    isPanelCollapsed={isPanelCollapsed}
                    onToggleCollapse={() => setIsPanelCollapsed(c => !c)}
                    scene={activeScene}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                    allClasses={allClasses}
                    allSpells={allSpells}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={handleTokenSelect}
                    onActionActivate={handleActionActivate}
                />
            </aside>
            <InitiativeDialog 
                isOpen={isInitiativeDialogOpen}
                onOpenChange={setIsInitiativeDialogOpen}
                scene={activeScene}
                allPlayerCharacters={allPlayerCharacters}
                allEnemies={allEnemies}
                onCombatStart={handleCombatStart}
            />
        </div>
    );
}
