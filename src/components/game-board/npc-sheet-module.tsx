
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, Footprints, Swords, Star, MessageSquare } from 'lucide-react';
import type { Enemy, Scene, MonsterAction, Combatant } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';

interface NpcSheetModuleProps {
  scene: Scene | null;
  allEnemies: Enemy[];
  selectedTokenId: string | null;
  onTokenSelect: (id: string | null) => void;
  onActionActivate: (action: MonsterAction) => void;
  activeCombatant: Combatant | null;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl font-semibold">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

const ActionSection = ({ title, actions, icon, onActionActivate, disabled }: { title: string, actions: Enemy['action'], icon: React.ReactNode, disabled: boolean, onActionActivate?: (action: MonsterAction) => void }) => {
    if (!actions || actions.length === 0) return null;
    return (
        <AccordionItem value={title.toLowerCase()}>
            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                <div className="flex items-center gap-2">{icon} {title}</div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
                 <div className="space-y-3 pt-2 border-t text-sm">
                    {actions.map((action) => (
                        <div key={action.name}>
                            <p>
                                <Button variant="link" className="p-0 h-auto font-bold text-foreground hover:underline" disabled={disabled} onClick={() => onActionActivate && onActionActivate(action)}>
                                    {action.name}.
                                </Button>
                                {' '}{action.text}
                            </p>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export function NpcSheetModule({ scene, allEnemies, selectedTokenId, onTokenSelect, onActionActivate, activeCombatant }: NpcSheetModuleProps) {
  
  const npcTokens = useMemo(() => {
    if (!scene) return [];
    return scene.tokens.filter(t => t.type === 'monster' || t.type === 'npc');
  }, [scene]);

  const { token, enemy } = useMemo(() => {
    if (!selectedTokenId || !scene) return { token: null, enemy: null };

    const token = scene.tokens.find(t => t.id === selectedTokenId);
    if (!token || (token.type !== 'monster' && token.type !== 'npc')) return { token: null, enemy: null };

    const enemy = allEnemies.find(e => e.id === token.linked_enemy_id);
    return { token, enemy };
  }, [selectedTokenId, scene, allEnemies]);
  
  const isMyTurn = activeCombatant?.tokenId === selectedTokenId;
  const canAct = isMyTurn && activeCombatant?.hasAction;
  // For simplicity, we assume monster actions are 'Action' type. A more complex system could parse this.
  const actionDisabled = !isMyTurn || !canAct;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Label>Select NPC</Label>
        <Select value={selectedTokenId || ''} onValueChange={onTokenSelect}>
            <SelectTrigger>
                <SelectValue placeholder="Select an NPC..." />
            </SelectTrigger>
            <SelectContent>
                {npcTokens.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {enemy && token ? (
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
                        <span>{token.hp ?? 'N/A'} / {token.maxHp ?? 'N/A'}</span>
                    </div>
                    <Progress value={token.hp && token.maxHp ? (token.hp/token.maxHp)*100 : 0} className={"[&>div]:bg-red-500"} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <StatDisplay icon={<Shield />} label="Armor Class" value={enemy.ac} />
                    <StatDisplay icon={<Footprints />} label="Speed" value={enemy.speed} />
                </div>

                <Separator />
                
                <div className="grid grid-cols-3 gap-2">
                    <StatDisplay icon={<>STR</>} label="Strength" value={enemy.str} />
                    <StatDisplay icon={<>DEX</>} label="Dexterity" value={enemy.dex} />
                    <StatDisplay icon={<>CON</>} label="Constitution" value={enemy.con} />
                    <StatDisplay icon={<>INT</>} label="Intelligence" value={enemy.int} />
                    <StatDisplay icon={<>WIS</>} label="Wisdom" value={enemy.wis} />
                    <StatDisplay icon={<>CHA</>} label="Charisma" value={enemy.cha} />
                </div>

                <Separator />

                <Accordion type="multiple" defaultValue={['traits', 'actions']} className="w-full space-y-1">
                    <ActionSection title="Traits" actions={enemy.trait} icon={<Star className="h-5 w-5" />} onActionActivate={onActionActivate} disabled={actionDisabled} />
                    <ActionSection title="Actions" actions={enemy.action} icon={<Swords className="h-5 w-5" />} onActionActivate={onActionActivate} disabled={actionDisabled}/>
                    <ActionSection title="Reactions" actions={enemy.reaction} icon={<MessageSquare className="h-5 w-5 rotate-90" />} onActionActivate={onActionActivate} disabled={!isMyTurn || !activeCombatant?.hasReaction} />
                    <ActionSection title="Legendary Actions" actions={enemy.legendary} icon={<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />} onActionActivate={onActionActivate} disabled={actionDisabled}/>
                </Accordion>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Shield className="h-12 w-12 mb-4" />
                <h3 className="font-semibold">Enemies & NPCs</h3>
                <p>Select an enemy on the map or from the list above.</p>
            </div>
        )}
      </ScrollArea>
    </div>
  );
}
