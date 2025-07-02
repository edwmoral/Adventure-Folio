
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatModule } from './chat-module';
import { MenuModule } from './menu-module';

interface ModulePanelProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
}

export function ModulePanel({ onTogglePosition, currentPosition }: ModulePanelProps) {
    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                    <TabsTrigger value="chat" className="rounded-none">Chat</TabsTrigger>
                    <TabsTrigger value="menu" className="rounded-none">Menu</TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
                   <ChatModule />
                </TabsContent>
                <TabsContent value="menu" className="p-4 mt-0">
                    <MenuModule onTogglePosition={onTogglePosition} currentPosition={currentPosition} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
