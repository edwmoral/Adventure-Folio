
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatModule } from './chat-module';
import { MenuModule } from './menu-module';
import { CharacterSheetModule } from './character-sheet-module';
import type { PlayerCharacter, Enemy, Token } from '@/lib/types';
import { ScrollText, Settings, MessageSquare } from "lucide-react";


interface ModulePanelProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
    token: Token | null;
    character: PlayerCharacter | null;
    enemy: Enemy | null;
}

export function ModulePanel({ 
    onTogglePosition, 
    currentPosition, 
    token,
    character,
    enemy
}: ModulePanelProps) {
    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                    <TabsTrigger value="chat" className="rounded-none flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="sheet" className="rounded-none flex items-center gap-2">
                        <ScrollText className="h-4 w-4"/>
                        <span>Sheet</span>
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="rounded-none flex items-center gap-2">
                        <Settings className="h-4 w-4"/>
                        <span>Menu</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
                   <ChatModule />
                </TabsContent>
                <TabsContent value="sheet" className="flex-1 min-h-0 mt-0">
                    <CharacterSheetModule 
                        token={token} 
                        character={character} 
                        enemy={enemy} 
                    />
                </TabsContent>
                <TabsContent value="menu" className="p-4 mt-0">
                    <MenuModule onTogglePosition={onTogglePosition} currentPosition={currentPosition} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
