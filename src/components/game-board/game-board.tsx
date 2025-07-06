'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Campaign, Scene, PlayerCharacter, Enemy, Class, Spell, Combatant, Action as ActionType, MonsterAction, Token, Item, Narration } from '@/lib/types';
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
import { saveCampaignsAndCleanup } from '@/lib/storage-utils';
import { useAuth } from '@/context/auth-context';
import { getDocForUser, saveDocForUser, getCollectionForUser, getGlobalCollection, getUserCollection } from '@/lib/firestore';

const STORAGE_KEY_COMBAT_STATE_PREFIX = 'dnd_combat_state_';

export function GameBoard({ campaignId }: { campaignId: string }) {
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<(Campaign & { id: string }) | null>(null);
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
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
    const [tokenToCenter, setTokenToCenter] = useState<string | null>(null);

    const [isInCombat, setIsInCombat] = useState(false);
    const [isInitiativeDialogOpen, setIsInitiativeDialogOpen] = useState(false);
    const [isInitiatingCombat, setIsInitiatingCombat] = useState(false);
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [turnIndex, setTurnIndex] = useState(0);
    const [recentRolls, setRecentRolls] = useState<string[]>([]);
    const [animationTarget, setAnimationTarget] = useState<string | null>(null);

    const [targetingMode, setTargetingMode] = useState<{ action: ActionType | MonsterAction | Spell, casterId: string } | null>(null);
    const { toast } = useToast();

    const minPanelWidth = 300;
    const maxPanelWidth = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;

    const startResizing = useCallback(() => { isResizing.current = true; }, []);
    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
    }, []);

    const resizePanel = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing.current) {
            document.body.style.cursor = 'col-resize';
            let newWidth = panelPosition === 'right' ? window.innerWidth - mouseMoveEvent.clientX : mouseMoveEvent.clientX;
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
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [
                    campaignData, 
                    players, 
                    enemies, 
                    classes, 
                    spells, 
                    items
                ] = await Promise.all([
                    getDocForUser<Campaign>('campaigns', campaignId),
                    getCollectionForUser<PlayerCharacter>('playerCharacters'),
                    getGlobalCollection<Enemy>('enemies'),
                    getGlobalCollection<Class>('classes'),
                    getGlobalCollection<Spell>('spells'),
                    getGlobalCollection<Item>('items'),
                ]);
                
                if (campaignData) {
                    setCampaign(campaignData);
                    setActiveScene(campaignData.scenes.find(s => s.is_active) || null);
                }
                setAllPlayerCharacters(players);
                setAllEnemies(enemies);
                setAllClasses(classes);
                setAllSpells(spells);
                setAllItems(items);

                const combatStateKey = `${STORAGE_KEY_COMBAT_STATE_PREFIX}${campaignId}`;
                const savedCombatStateJSON = localStorage.getItem(combatStateKey);
                if (savedCombatStateJSON) {
                    const savedState = JSON.parse(savedCombatStateJSON);
                    if (savedState && savedState.isInCombat) {
                        setCombatants(savedState.combatants || []);
                        setTurnIndex(savedState.turnIndex || 0);
                        setRecentRolls(savedState.recentRolls || []);
                        setIsInCombat(true);
                    }
                }
            } catch (error) {
                console.error("Failed to load data from Firestore", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load session data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [campaignId, user, toast]);

    useEffect(() => {
        if (loading || !campaign) return;

        try {
            const combatStateKey = `${STORAGE_KEY_COMBAT_STATE_PREFIX}${campaignId}`;
            if (isInCombat) {
                const combatState = { isInCombat, combatants, turnIndex, recentRolls };
                localStorage.setItem(combatStateKey, JSON.stringify(combatState));
            } else {
                localStorage.removeItem(combatStateKey);
            }
        } catch (error) {
            console.error("Failed to persist combat state:", error);
            toast({ variant: "destructive", title: "Save Error", description: "Could not save combat state." });
        }
    }, [isInCombat, combatants, turnIndex, recentRolls, campaignId, campaign, loading, toast]);
    
    const activeCampaignCharacters = useMemo(() => {
        if (!campaign || !allPlayerCharacters) return [];
        const campaignCharIds = new Set(campaign.characters.map(c => c.id));
        return allPlayerCharacters.filter(pc => campaignCharIds.has(pc.id));
    }, [campaign, allPlayerCharacters]);

    const handleTokenSelect = (id: string | null) => {
        setSelectedTokenId(id);
        if (id && isPanelCollapsed) setIsPanelCollapsed(false);
        if (!id) setTargetingMode(null);
    };

    const handleUpdateScene = useCallback(async (updatedScene: Scene) => {
        if(!campaign) return;

        const updatedCampaignData = {
            ...campaign,
            scenes: campaign.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)
        };
        
        setActiveScene(updatedScene);
        setCampaign(updatedCampaignData);
        
        const { id, ...campaignToSave } = updatedCampaignData;

        try {
            await saveDocForUser('campaigns', id, campaignToSave);
        } catch (error) {
            console.error("Failed to save campaign:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the campaign changes." });
        }
    }, [campaign, toast]);

    const handleFocusActiveCombatant = () => {
        if (isInCombat && combatants.length > 0) {
            const activeTokenId = combatants[turnIndex]?.tokenId;
            if (activeTokenId) setTokenToCenter(activeTokenId);
        }
    };

    const handleCombatStart = (finalCombatants: Combatant[]) => {
        setCombatants(finalCombatants);
        const rolls = finalCombatants.map(c => `${c.name}: ${c.initiative} (d20: ${c.initiativeRoll} + ${c.dexterityModifier})`);
        setRecentRolls(rolls);
        setTurnIndex(0);
        setIsInCombat(true);
        setIsInitiativeDialogOpen(false);
        handleTokenSelect(finalCombatants[0]?.tokenId);
    };
    
    const handleNextTurn = () => {
        if (!activeScene) return;

        const endingTurnTokenId = combatants[turnIndex]?.tokenId;
        const newTurnIndex = (turnIndex + 1) % combatants.length;
        const startingTurnTokenId = combatants[newTurnIndex]?.tokenId;

        const updatedTokens = activeScene.tokens.map(token => {
            let newStatusEffects = [...(token.statusEffects || [])];
            if (token.id === endingTurnTokenId) newStatusEffects = newStatusEffects.filter(e => e !== 'disengaged');
            if (token.id === startingTurnTokenId) newStatusEffects = newStatusEffects.filter(e => e !== 'dodging' && e !== 'helping');
            return { ...token, statusEffects: newStatusEffects };
        });

        handleUpdateScene({ ...activeScene, tokens: updatedTokens });

        const updatedCombatants = combatants.map((c, index) => ({
            ...c,
            hasAction: index === newTurnIndex,
            hasBonusAction: index === newTurnIndex,
            hasReaction: index === newTurnIndex,
        }));

        setCombatants(updatedCombatants);
        setTurnIndex(newTurnIndex);
        setTokenToCenter(updatedCombatants[newTurnIndex]?.tokenId);
    };

    const handleEndCombat = () => {
        setIsInCombat(false);
        setCombatants([]);
        setTurnIndex(0);
        setRecentRolls([]);
    };
    
    const handleUseAction = (actionType: string) => {
        if (!isInCombat) return;
        setCombatants(prev => prev.map((c, index) => {
            if (index === turnIndex) {
                const updatedCombatant = { ...c };
                if (actionType === 'Action') updatedCombatant.hasAction = false;
                if (actionType === 'Bonus Action') updatedCombatant.hasBonusAction = false;
                if (actionType === 'Reaction') updatedCombatant.hasReaction = false;
                return updatedCombatant;
            }
            return c;
        }));
    };

    const handleActionActivate = useCallback((action: ActionType | MonsterAction | Spell) => {
        if (!selectedTokenId) {
            toast({ variant: 'destructive', title: 'No Caster', description: 'Select a token before activating an action.' });
            return;
        }
        
        const activeCombatant = combatants[turnIndex];
        const isPlayerTurn = isInCombat && activeCombatant?.tokenId === selectedTokenId;
        
        if (isInCombat && !isPlayerTurn) {
             toast({ variant: 'destructive', title: 'Not Your Turn', description: 'This action can only be taken on your turn.' });
            return;
        }

        let actionType = 'level' in action ? (action.time.toLowerCase().includes('bonus') ? 'Bonus Action' : 'Action') : ('type' in action ? action.type : 'Action');

        if (isPlayerTurn) {
            if (actionType === 'Action' && !activeCombatant.hasAction) { toast({ variant: 'destructive', title: 'No Action' }); return; }
            if (actionType === 'Bonus Action' && !activeCombatant.hasBonusAction) { toast({ variant: 'destructive', title: 'No Bonus Action' }); return; }
            if (actionType === 'Reaction' && !activeCombatant.hasReaction) { toast({ variant: 'destructive', title: 'No Reaction' }); return; }
        }
        
        if (!isInCombat) setIsInitiatingCombat(true);

        const selfCastActions: Record<string, 'dodging' | 'disengaged' | 'hidden'> = { 'Dodge': 'dodging', 'Disengage': 'disengaged', 'Hide': 'hidden' };
        const selfCastEffect = selfCastActions[action.name];

        if (selfCastEffect && activeScene) {
            handleUseAction('Action');
            const updatedTokens = activeScene.tokens.map(token => {
                if (token.id === selectedTokenId) {
                    const newStatusEffects = [...(token.statusEffects || []), selfCastEffect];
                    return { ...token, statusEffects: Array.from(new Set(newStatusEffects)) };
                }
                return token;
            });
            handleUpdateScene({ ...activeScene, tokens: updatedTokens });
            toast({ title: 'Status Applied!', description: `${action.name} is now active.` });
            if (!isInCombat) setIsInitiativeDialogOpen(true);
            return;
        }

        const rangeInfo = parseRangeFromAction(action);
        if (!rangeInfo || (rangeInfo.type !== 'self' && rangeInfo.value === 0)) {
            handleUseAction(actionType);
            toast({ title: "Action Used", description: `You used ${action.name}.` });
            if (!isInCombat) setIsInitiativeDialogOpen(true);
            return;
        }
        
        if (rangeInfo.type === 'self') {
            handleUseAction(actionType);
            toast({ title: "Action Used", description: `You used ${action.name} on yourself.` });
            if (!isInCombat) setIsInitiativeDialogOpen(true);
            return;
        }

        setTargetingMode({ action, casterId: selectedTokenId });
        toast({ title: "Targeting...", description: `Select a target for ${action.name}. Right-click to cancel.` });
    }, [selectedTokenId, toast, activeScene, handleUpdateScene, combatants, turnIndex, isInCombat]);

    const handleTargetSelect = useCallback((targetId: string) => {
        if (!targetingMode || !activeScene) return;
        
        setAnimationTarget(targetId);
        setTimeout(() => setAnimationTarget(null), 800);

        let actionType = 'level' in targetingMode.action ? (targetingMode.action.time.toLowerCase().includes('bonus') ? 'Bonus Action' : 'Action') : ('type' in targetingMode.action ? targetingMode.action.type : 'Action');
        handleUseAction(actionType);
        
        const casterToken = activeScene.tokens.find(t => t.id === targetingMode.casterId);
        const targetToken = activeScene.tokens.find(t => t.id === targetId);
        
        if (targetingMode.action.name === 'Help') {
            if (targetId === targetingMode.casterId) { toast({ variant: 'destructive', title: 'Invalid Target', description: 'You cannot help yourself.' }); setTargetingMode(null); return; }
            if (targetToken?.type !== 'character') { toast({ variant: 'destructive', title: 'Invalid Target', description: 'You can only help allied characters.' }); setTargetingMode(null); return; }
            
            const updatedTokens = activeScene.tokens.map(token => {
                if (token.id === targetId) {
                    const newStatusEffects = [...(token.statusEffects || []), 'helping'];
                    return { ...token, statusEffects: Array.from(new Set(newStatusEffects)) };
                }
                return token;
            });
            handleUpdateScene({ ...activeScene, tokens: updatedTokens });
            toast({ title: 'Action Used!', description: `${casterToken?.name} is helping ${targetToken?.name}.` });
        } else {
            if (casterToken && targetToken) {
                toast({ title: 'Action Targeted!', description: `${casterToken.name} used ${targetingMode.action.name} on ${targetToken.name}. ${'effects' in targetingMode.action ? targetingMode.action.effects : ''}` });
            }
        }
        
        if (isInitiatingCombat) {
            setIsInitiatingCombat(false);
            setIsInitiativeDialogOpen(true);
        }
        setTargetingMode(null);
    }, [targetingMode, activeScene, toast, handleUpdateScene, isInitiatingCombat, handleUseAction]);

    const handleCancelTargeting = useCallback(() => {
        setTargetingMode(null);
        if (isInitiatingCombat) setIsInitiatingCombat(false);
    }, [isInitiatingCombat]);

    const handleNarrationCreate = (data: { plotSummary: string; audioId: string; voice: string; }) => {
        if (!activeScene) return;
        const newNarration: Narration = { id: `narration-${Date.now()}`, ...data };
        handleUpdateScene({ ...activeScene, narrations: [...(activeScene.narrations || []), newNarration] });
    };

    const handleNarrationDelete = (narrationId: string) => {
        if (!activeScene) return;
        handleUpdateScene({ ...activeScene, narrations: (activeScene.narrations || []).filter(n => n.id !== narrationId) });
    };

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
    const activeCombatant = isInCombat ? combatants[turnIndex] : null;

    return (
        <div className={cn("fixed inset-0 bg-muted flex", panelPosition === 'right' ? 'flex-row' : 'flex-row-reverse')}>
            <main className="flex-1 h-full bg-black relative">
                {isInCombat && <InitiativeTracker combatants={combatants} activeTurnIndex={turnIndex} />}
                 <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
                    {isInCombat && recentRolls.length > 0 && (
                        <div className="text-xs text-white bg-black/50 p-2 rounded-md max-w-xs text-right shadow-lg">
                        <h4 className="font-bold mb-1">Initiative Rolls</h4>
                        {recentRolls.map((roll, i) => <p key={i}>{roll}</p>)}
                        </div>
                    )}
                    {!isInCombat ? (
                        <Button onClick={() => setIsInitiativeDialogOpen(true)}> <Swords className="mr-2 h-4 w-4" /> Start Combat </Button>
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
                    activeCombatantId={activeCombatant?.tokenId ?? null}
                    targetingMode={targetingMode}
                    onTargetSelect={handleTargetSelect}
                    onCancelTargeting={handleCancelTargeting}
                    tokenToCenter={tokenToCenter}
                    onCenterTokenComplete={() => setTokenToCenter(null)}
                    animationTarget={animationTarget}
                />
            </main>
            
            {!isPanelCollapsed && (
                <div 
                    className={cn( "w-1.5 h-full cursor-col-resize bg-border hover:bg-primary transition-colors", panelPosition === 'left' && 'order-first' )}
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
                    allItems={allItems}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={handleTokenSelect}
                    onActionActivate={handleActionActivate}
                    activeCombatant={activeCombatant}
                    narrations={activeScene.narrations || []}
                    onNarrationCreate={handleNarrationCreate}
                    onNarrationDelete={handleNarrationDelete}
                    activeCampaignCharacters={activeCampaignCharacters}
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
