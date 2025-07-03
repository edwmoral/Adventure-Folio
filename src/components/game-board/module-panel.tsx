'use client';
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatModule } from './chat-module';
import { MenuModule } from './menu-module';
import { PlayerCharacterSheetModule } from './player-character-sheet-module';
import { NpcSheetModule } from './npc-sheet-module';
import { NarrationModule } from './narration-module';
import type { PlayerCharacter, Enemy, Scene, Class, Spell, Action as ActionType, MonsterAction, Combatant, Item } from '@/lib/types';
import { Users, Shield, Settings, MessageSquare, BookText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";


interface ModulePanelProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
    isPanelCollapsed: boolean;
    onToggleCollapse: () => void;
    scene: Scene | null;
    allPlayerCharacters: PlayerCharacter[];
    allEnemies: Enemy[];
    allClasses: Class[];
    allSpells: Spell[];
    allItems: Item[];
    selectedTokenId: string | null;
    onTokenSelect: (id: string | null) => void;
    onActionActivate: (action: ActionType | MonsterAction | Spell) => void;
    activeCombatant: Combatant | null;
}

export function ModulePanel({ 
    onTogglePosition, 
    currentPosition, 
    isPanelCollapsed,
    onToggleCollapse,
    scene,
    allPlayerCharacters,
    allEnemies,
    allClasses,
    allSpells,
    allItems,
    selectedTokenId,
    onTokenSelect,
    onActionActivate,
    activeCombatant,
}: ModulePanelProps) {
    const [activeTab, setActiveTab] = useState('chat');

    useEffect(() => {
        if (selectedTokenId && scene) {
            const token = scene.tokens.find(t => t.id === selectedTokenId);
            if (token) {
                if (token.type === 'character') {
                    setActiveTab('characters');
                } else if (token.type === 'monster' || token.type === 'npc') {
                    setActiveTab('npcs');
                }
            }
        }
    }, [selectedTokenId, scene]);
    
    const CollapseIcon = currentPosition === 'right' ? ChevronRight : ChevronLeft;
    const ExpandIcon = currentPosition === 'right' ? ChevronLeft : ChevronRight;
    
    if (isPanelCollapsed) {
        return (
             <div className="h-full w-full flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="h-full w-full rounded-none hover:bg-accent"
                >
                    <ExpandIcon className="h-5 w-5" />
                    <span className="sr-only">Open Panel</span>
                </Button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background border",
                    currentPosition === 'right' ? ' -left-4' : '-right-4'
                )}
            >
                <CollapseIcon className="h-5 w-5" />
                <span className="sr-only">Collapse Panel</span>
            </Button>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
                    <TabsTrigger value="chat" className="rounded-none flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span>Chat</span>
                    </TabsTrigger>
                     <TabsTrigger value="narration" className="rounded-none flex items-center gap-2">
                        <BookText className="h-4 w-4"/>
                        <span>Narration</span>
                    </TabsTrigger>
                    <TabsTrigger value="characters" className="rounded-none flex items-center gap-2">
                        <Users className="h-4 w-4"/>
                        <span>Characters</span>
                    </TabsTrigger>
                    <TabsTrigger value="npcs" className="rounded-none flex items-center gap-2">
                        <Shield className="h-4 w-4"/>
                        <span>NPCs</span>
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="rounded-none flex items-center gap-2">
                        <Settings className="h-4 w-4"/>
                        <span>Menu</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
                   <ChatModule />
                </TabsContent>
                <TabsContent value="narration" className="flex-1 min-h-0 mt-0">
                    <NarrationModule />
                </TabsContent>
                <TabsContent value="characters" className="flex-1 min-h-0 mt-0">
                    <PlayerCharacterSheetModule 
                        scene={scene} 
                        allPlayerCharacters={allPlayerCharacters}
                        allClasses={allClasses}
                        allSpells={allSpells}
                        allItems={allItems}
                        selectedTokenId={selectedTokenId}
                        onTokenSelect={onTokenSelect}
                        onActionActivate={onActionActivate}
                        activeCombatant={activeCombatant}
                    />
                </TabsContent>
                 <TabsContent value="npcs" className="flex-1 min-h-0 mt-0">
                    <NpcSheetModule 
                        scene={scene} 
                        allEnemies={allEnemies}
                        selectedTokenId={selectedTokenId}
                        onTokenSelect={onTokenSelect}
                        onActionActivate={onActionActivate}
                        activeCombatant={activeCombatant}
                    />
                </TabsContent>
                <TabsContent value="menu" className="flex-1 min-h-0 mt-0 p-4">
                    <MenuModule onTogglePosition={onTogglePosition} currentPosition={currentPosition} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
