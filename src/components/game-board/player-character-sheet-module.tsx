
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, Footprints, Users } from 'lucide-react';
import type { PlayerCharacter, Scene, Token } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PlayerCharacterSheetModuleProps {
  scene: Scene | null;
  allPlayerCharacters: PlayerCharacter[];
  selectedTokenId: string | null;
  onTokenSelect: (id: string | null) => void;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl font-semibold">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

export function PlayerCharacterSheetModule({ scene, allPlayerCharacters, selectedTokenId, onTokenSelect }: PlayerCharacterSheetModuleProps) {
  
  const playerTokens = useMemo(() => {
    if (!scene) return [];
    return scene.tokens.filter(t => t.type === 'character');
  }, [scene]);

  const { token, character } = useMemo(() => {
    if (!selectedTokenId || !scene) return { token: null, character: null };

    const token = scene.tokens.find(t => t.id === selectedTokenId);
    if (!token || token.type !== 'character') return { token: null, character: null };

    const character = allPlayerCharacters.find(c => c.id === token.linked_character_id);
    return { token, character };
  }, [selectedTokenId, scene, allPlayerCharacters]);

  return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b">
            <Label>Select Character</Label>
            <Select value={selectedTokenId || ''} onValueChange={onTokenSelect}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a character..." />
                </SelectTrigger>
                <SelectContent>
                    {playerTokens.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <ScrollArea className="flex-1">
            {character && token ? (
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-4" style={{ borderColor: character.tokenBorderColor || 'hsl(var(--primary))' }}>
                            <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                            <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold font-headline">{token.name}</h2>
                            <p className="text-muted-foreground">
                                {character.race} {character.className}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Health</span>
                            <span>{token.hp ?? character.hp} / {token.maxHp ?? character.maxHp}</span>
                        </div>
                        <Progress value={(token.hp && token.maxHp) ? (token.hp/token.maxHp)*100 : 0} className={"[&>div]:bg-green-500"} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StatDisplay icon={<Shield />} label="Armor Class" value={character.ac} />
                        <StatDisplay icon={<Footprints />} label="Speed" value={'30 ft.'} />
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-2">
                        <StatDisplay icon={<>STR</>} label="Strength" value={character.stats.str} />
                        <StatDisplay icon={<>DEX</>} label="Dexterity" value={character.stats.dex} />
                        <StatDisplay icon={<>CON</>} label="Constitution" value={character.stats.con} />
                        <StatDisplay icon={<>INT</>} label="Intelligence" value={character.stats.int} />
                        <StatDisplay icon={<>WIS</>} label="Wisdom" value={character.stats.wis} />
                        <StatDisplay icon={<>CHA</>} label="Charisma" value={character.stats.cha} />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="font-semibold">Actions & Abilities</h3>
                        <p className="text-sm text-muted-foreground">Character actions and abilities will be shown here.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <Users className="h-12 w-12 mb-4" />
                    <h3 className="font-semibold">Player Characters</h3>
                    <p>Select a player on the map or from the list above.</p>
                </div>
            )}
        </ScrollArea>
    </div>
  );
}
