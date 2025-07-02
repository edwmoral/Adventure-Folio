
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Heart, Shield, Swords, Footprints } from 'lucide-react';
import type { PlayerCharacter, Enemy, Token } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface CharacterSheetModuleProps {
  token: Token | null;
  character: PlayerCharacter | null;
  enemy: Enemy | null;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

export function CharacterSheetModule({ token, character, enemy }: CharacterSheetModuleProps) {
  if (!token) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
        <p>Select a token on the map to view its details.</p>
      </div>
    );
  }
  
  const data = character || enemy;
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
        <p>Loading character data...</p>
      </div>
    );
  }

  const isPlayer = !!character;
  const health = token.hp ?? (isPlayer ? character.hp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
  const maxHealth = token.maxHp ?? (isPlayer ? character.maxHp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
  const healthPercent = (health !== undefined && maxHealth && maxHealth > 0) ? (health / maxHealth) * 100 : 100;
  
  const ac = isPlayer ? character.ac : (enemy ? parseInt(String(enemy.ac)) : 'N/A');
  const speed = isPlayer ? '30 ft.' : enemy?.speed;

  return (
    <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
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

            <div className="grid grid-cols-3 gap-2">
                <StatDisplay icon={<Shield />} label="Armor Class" value={ac || 'N/A'} />
                <StatDisplay icon={<Footprints />} label="Speed" value={speed || 'N/A'} />
            </div>

            <Separator />
            
            {character && (
                <div className="grid grid-cols-3 gap-2">
                    <StatDisplay icon={<>STR</>} label="Strength" value={character.stats.str} />
                    <StatDisplay icon={<>DEX</>} label="Dexterity" value={character.stats.dex} />
                    <StatDisplay icon={<>CON</>} label="Constitution" value={character.stats.con} />
                    <StatDisplay icon={<>INT</>} label="Intelligence" value={character.stats.int} />
                    <StatDisplay icon={<>WIS</>} label="Wisdom" value={character.stats.wis} />
                    <StatDisplay icon={<>CHA</>} label="Charisma" value={character.stats.cha} />
                </div>
            )}
            
            {enemy && (
                 <div className="grid grid-cols-3 gap-2">
                    <StatDisplay icon={<>STR</>} label="Strength" value={enemy.str} />
                    <StatDisplay icon={<>DEX</>} label="Dexterity" value={enemy.dex} />
                    <StatDisplay icon={<>CON</>} label="Constitution" value={enemy.con} />
                    <StatDisplay icon={<>INT</>} label="Intelligence" value={enemy.int} />
                    <StatDisplay icon={<>WIS</>} label="Wisdom" value={enemy.wis} />
                    <StatDisplay icon={<>CHA</>} label="Charisma" value={enemy.cha} />
                </div>
            )}

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
        </div>
    </ScrollArea>
  );
}
