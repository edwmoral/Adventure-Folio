
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatModule } from './chat-module';
import { MenuModule } from './menu-module';
import { PlayerCharacterSheetModule } from './player-character-sheet-module';
import { NpcSheetModule } from './npc-sheet-module';
import type { PlayerCharacter, Enemy, Scene } from '@/lib/types';
import { Users, Shield, Settings, MessageSquare } from "lucide-react";


interface ModulePanelProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
    scene: Scene | null;
    allPlayerCharacters: PlayerCharacter[];
    allEnemies: Enemy[];
    selectedTokenId: string | null;
}

export function ModulePanel({ 
    onTogglePosition, 
    currentPosition, 
    scene,
    allPlayerCharacters,
    allEnemies,
    selectedTokenId,
}: ModulePanelProps) {
    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
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
                        selectedTokenId={selectedTokenId}
                    />
                </TabsContent>
                 <TabsContent value="npcs" className="flex-1 min-h-0 mt-0">
                    <NpcSheetModule 
                        scene={scene} 
                        allEnemies={allEnemies}
                        selectedTokenId={selectedTokenId}
                    />
                </TabsContent>
                <TabsContent value="menu" className="flex-1 min-h-0 mt-0 p-4">
                    <MenuModule onTogglePosition={onTogglePosition} currentPosition={currentPosition} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
