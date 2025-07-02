
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, Footprints } from 'lucide-react';
import type { Enemy, Scene } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface NpcSheetModuleProps {
  scene: Scene | null;
  allEnemies: Enemy[];
  selectedTokenId: string | null;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl font-semibold">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

export function NpcSheetModule({ scene, allEnemies, selectedTokenId }: NpcSheetModuleProps) {
  
  const { token, enemy } = useMemo(() => {
    if (!selectedTokenId || !scene) return { token: null, enemy: null };

    const token = scene.tokens.find(t => t.id === selectedTokenId);
    if (!token || (token.type !== 'monster' && token.type !== 'npc')) return { token: null, enemy: null };

    const enemy = allEnemies.find(e => e.id === token.linked_enemy_id);
    return { token, enemy };
  }, [selectedTokenId, scene, allEnemies]);
  
  if (!enemy || !token) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <Shield className="h-12 w-12 mb-4" />
        <h3 className="font-semibold">Enemies & NPCs</h3>
        <p>Select an enemy or NPC on the map to view their details.</p>
      </div>
    );
  }

  const stats = {
    str: enemy.str, dex: enemy.dex, con: enemy.con, int: enemy.int, wis: enemy.wis, cha: enemy.cha
  };

  const health = token.hp ?? (enemy ? parseInt(String(enemy.hp).split(' ')[0]) : undefined);
  const maxHealth = token.maxHp ?? (enemy ? parseInt(String(enemy.hp).split(' ')[0]) : undefined);
  const healthPercent = (health !== undefined && maxHealth && maxHealth > 0) ? (health / maxHealth) * 100 : 100;
  
  const ac = enemy.ac;
  const speed = enemy.speed;

  return (
    <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-destructive">
                    <AvatarImage src={token.imageUrl} data-ai-hint="fantasy monster icon" />
                    <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold font-headline">{token.name}</h2>
                    <p className="text-muted-foreground">
                        {enemy.type}
                    </p>
                </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Health</span>
                    <span>{health} / {maxHealth}</span>
                </div>
                <Progress value={healthPercent} className={"[&>div]:bg-red-500"} />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <StatDisplay icon={<Shield />} label="Armor Class" value={ac} />
                <StatDisplay icon={<Footprints />} label="Speed" value={speed} />
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
                    {enemy.trait?.map(t => (
                        <div key={t.name}>
                            <p><span className="font-bold text-foreground">{t.name}.</span> {t.text}</p>
                        </div>
                    ))}
                    {enemy.action?.map(a => (
                        <div key={a.name}>
                            <p><span className="font-bold text-foreground">{a.name}.</span> {a.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </ScrollArea>
  );
}
