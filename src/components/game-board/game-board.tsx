
'use client';

import { useState, useEffect } from 'react';
import type { Campaign, Scene, PlayerCharacter, Enemy, Class, Spell, Combatant } from '@/lib/types';
import { BattleMap } from './battle-map';
import { ModulePanel } from './module-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Swords, LocateFixed } from 'lucide-react';
import { InitiativeDialog } from './initiative-dialog';
import { InitiativeTracker } from './initiative-tracker';

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
                setSelectedTokenId(activeTokenId);
            }
        }
    };

    const handleCombatStart = (finalCombatants: Combatant[]) => {
        setCombatants(finalCombatants);
        setTurnIndex(0);
        setIsInCombat(true);
        setIsInitiativeDialogOpen(false);
        setSelectedTokenId(finalCombatants[0]?.tokenId);
    };
    
    const handleNextTurn = () => {
        const newTurnIndex = (turnIndex + 1) % combatants.length;
        setTurnIndex(newTurnIndex);
        setSelectedTokenId(combatants[newTurnIndex]?.tokenId);
    };

    const handleEndCombat = () => {
        setIsInCombat(false);
        setCombatants([]);
        setTurnIndex(0);
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
    
    const panelClasses = "w-[350px] h-full flex-shrink-0 bg-background";
    const borderClass = panelPosition === 'right' ? 'border-l' : 'border-r';
    const activeCombatantId = isInCombat ? combatants[turnIndex]?.tokenId : null;

    return (
        <div className={`fixed inset-0 bg-muted flex ${panelPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
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
                    onTokenSelect={setSelectedTokenId}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                    isInCombat={isInCombat}
                    activeCombatantId={activeCombatantId}
                />
            </main>
            <aside className={`${panelClasses} ${borderClass} border-border`}>
                <ModulePanel 
                    currentPosition={panelPosition}
                    onTogglePosition={() => setPanelPosition(p => p === 'left' ? 'right' : 'left')} 
                    scene={activeScene}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                    allClasses={allClasses}
                    allSpells={allSpells}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={setSelectedTokenId}
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
