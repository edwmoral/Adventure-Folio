
'use client';
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatModule } from './chat-module';
import { MenuModule } from './menu-module';
import { PlayerCharacterSheetModule } from './player-character-sheet-module';
import { NpcSheetModule } from './npc-sheet-module';
import type { PlayerCharacter, Enemy, Scene, Class, Spell } from '@/lib/types';
import { Users, Shield, Settings, MessageSquare, ScrollText } from "lucide-react";


interface ModulePanelProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
    scene: Scene | null;
    allPlayerCharacters: PlayerCharacter[];
    allEnemies: Enemy[];
    allClasses: Class[];
    allSpells: Spell[];
    selectedTokenId: string | null;
    onTokenSelect: (id: string | null) => void;
}

export function ModulePanel({ 
    onTogglePosition, 
    currentPosition, 
    scene,
    allPlayerCharacters,
    allEnemies,
    allClasses,
    allSpells,
    selectedTokenId,
    onTokenSelect,
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

    return (
        <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                    <TabsTrigger value="chat" className="rounded-none flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span>Chat</span>
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
                <TabsContent value="characters" className="flex-1 min-h-0 mt-0">
                    <PlayerCharacterSheetModule 
                        scene={scene} 
                        allPlayerCharacters={allPlayerCharacters}
                        allClasses={allClasses}
                        allSpells={allSpells}
                        selectedTokenId={selectedTokenId}
                        onTokenSelect={onTokenSelect}
                    />
                </TabsContent>
                 <TabsContent value="npcs" className="flex-1 min-h-0 mt-0">
                    <NpcSheetModule 
                        scene={scene} 
                        allEnemies={allEnemies}
                        selectedTokenId={selectedTokenId}
                        onTokenSelect={onTokenSelect}
                    />
                </TabsContent>
                <TabsContent value="menu" className="flex-1 min-h-0 mt-0 p-4">
                    <MenuModule onTogglePosition={onTogglePosition} currentPosition={currentPosition} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
