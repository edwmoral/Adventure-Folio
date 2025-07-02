
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, Footprints } from 'lucide-react';
import type { PlayerCharacter, Enemy, Token, Scene } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CharacterSheetModuleProps {
  scene: Scene | null;
  allPlayerCharacters: PlayerCharacter[];
  allEnemies: Enemy[];
  selectedTokenId: string | null;
  onTokenSelect: (tokenId: string | null) => void;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl font-semibold">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

export function CharacterSheetModule({ scene, allPlayerCharacters, allEnemies, selectedTokenId, onTokenSelect }: CharacterSheetModuleProps) {
  
  const { token, character, enemy } = useMemo(() => {
    if (!selectedTokenId || !scene) return { token: null, character: null, enemy: null };

    const token = scene.tokens.find(t => t.id === selectedTokenId);
    if (!token) return { token: null, character: null, enemy: null };

    if (token.type === 'character') {
        const character = allPlayerCharacters.find(c => c.id === token.linked_character_id);
        return { token, character, enemy: null };
    } else if (token.type === 'monster') {
        const enemy = allEnemies.find(e => e.id === token.linked_enemy_id);
        return { token, character: null, enemy };
    }
    return { token, character: null, enemy: null };
  }, [selectedTokenId, scene, allPlayerCharacters, allEnemies]);
  
  if (!scene) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
        <p>No active scene data.</p>
      </div>
    );
  }

  const playerTokens = scene.tokens.filter(t => t.type === 'character');
  const enemyTokens = scene.tokens.filter(t => t.type === 'monster' || t.type === 'npc');

  const isPlayer = !!character;
  const data = character || enemy;
  
  const stats = data ? (isPlayer ? character.stats : {
    str: enemy.str, dex: enemy.dex, con: enemy.con, int: enemy.int, wis: enemy.wis, cha: enemy.cha
  }) : null;

  const health = token?.hp ?? (isPlayer ? character?.hp : (enemy ? parseInt(String(enemy.hp).split(' ')[0]) : undefined));
  const maxHealth = token?.maxHp ?? (isPlayer ? character?.maxHp : (enemy ? parseInt(String(enemy.hp).split(' ')[0]) : undefined));
  const healthPercent = (health !== undefined && maxHealth && maxHealth > 0) ? (health / maxHealth) * 100 : 100;
  
  const ac = isPlayer ? character?.ac : (enemy ? parseInt(String(enemy.ac)) : 'N/A');
  const speed = isPlayer ? '30 ft.' : enemy?.speed;

  return (
    <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
            <Select value={selectedTokenId || 'none'} onValueChange={(value) => onTokenSelect(value === 'none' ? null : value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a character or enemy..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {playerTokens.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Player Characters</SelectLabel>
                            {playerTokens.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                    {enemyTokens.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Enemies & NPCs</SelectLabel>
                            {enemyTokens.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>

            {!token || !data || !stats ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground pt-16">
                    <p>Select a token on the map or from the dropdown to view its details.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-4" style={{ borderColor: isPlayer ? (character?.tokenBorderColor || 'hsl(var(--primary))') : 'hsl(var(--destructive))' }}>
                            <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                            <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold font-headline">{token.name}</h2>
                            <p className="text-muted-foreground">
                                {isPlayer ? `${character.race} ${character.className}` : `${enemy?.type}`}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Health</span>
                            <span>{health} / {maxHealth}</span>
                        </div>
                        <Progress value={healthPercent} className={isPlayer ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StatDisplay icon={<Shield />} label="Armor Class" value={ac || 'N/A'} />
                        <StatDisplay icon={<Footprints />} label="Speed" value={speed || 'N/A'} />
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-2">
                        <StatDisplay icon={<>STR</>} label="Strength" value={stats.str} />
                        <StatDisplay icon={<>DEX</>} label="Dexterity" value={stats.dex} />
                        <StatDisplay icon={<>CON</>} label="Constitution" value={stats.con} />
                        <StatDisplay icon={<>INT</>} label="Intelligence" value={stats.int} />
                        <StatDisplay icon={<>WIS</>} label="Wisdom" value={stats.wis} />
                        <StatDisplay icon={<>CHA</>} label="Charisma" value={stats.cha} />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="font-semibold">Actions & Traits</h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                            {enemy?.trait?.map(t => (
                                <div key={t.name}>
                                    <p><span className="font-bold text-foreground">{t.name}.</span> {t.text}</p>
                                </div>
                            ))}
                            {enemy?.action?.map(a => (
                                <div key={a.name}>
                                    <p><span className="font-bold text-foreground">{a.name}.</span> {a.text}</p>
                                </div>
                            ))}
                        </div>
                        {isPlayer && (
                            <p className="text-sm text-muted-foreground">Character actions and abilities will be shown here.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    </ScrollArea>
  );
}
