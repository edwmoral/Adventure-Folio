
'use client';

import { useState, useEffect } from 'react';
import type { Campaign, Scene, Token, PlayerCharacter, Enemy } from '@/lib/types';
import { BattleMap } from './battle-map';
import { ModulePanel } from './module-panel';
import { Skeleton } from '@/components/ui/skeleton';

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_ENEMIES = 'dnd_enemies';


export function GameBoard({ campaignId }: { campaignId: string }) {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [activeScene, setActiveScene] = useState<Scene | null>(null);
    const [loading, setLoading] = useState(true);
    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('right');

    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

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

    return (
        <div className={`fixed inset-0 bg-muted flex ${panelPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
            <main className="flex-1 h-full bg-black">
                <BattleMap 
                    scene={activeScene} 
                    onSceneUpdate={handleUpdateScene}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={setSelectedTokenId}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                />
            </main>
            <aside className={`${panelClasses} ${borderClass} border-border`}>
                <ModulePanel 
                    currentPosition={panelPosition}
                    onTogglePosition={() => setPanelPosition(p => p === 'left' ? 'right' : 'left')} 
                    scene={activeScene}
                    allPlayerCharacters={allPlayerCharacters}
                    allEnemies={allEnemies}
                    selectedTokenId={selectedTokenId}
                    onTokenSelect={setSelectedTokenId}
                />
            </aside>
        </div>
    );
}
