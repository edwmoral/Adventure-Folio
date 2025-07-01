
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Swords, Footprints, CheckCircle2, XCircle } from 'lucide-react';
import type { PlayerCharacter, Enemy, Token, Action, MonsterAction } from '@/lib/types';
import { Progress } from './ui/progress';

interface ActionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token | null;
  character: PlayerCharacter | null;
  enemy: Enemy | null;
  actions: Action[];
  container?: HTMLElement | null;
  isInCombat?: boolean;
  combatState?: {
      movementRemaining: number;
      hasAction: boolean;
      hasBonusAction: boolean;
  } | null;
  onUseAction?: (type: 'action' | 'bonus') => void;
  onDash?: () => void;
  onAttack?: () => void;
  onDodge?: () => void;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

const ActionButton = ({ name, description, ...props }: { name: string, description: string } & React.ComponentProps<typeof Button>) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="outline" className="w-full justify-start" {...props}>
                {name}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
            <p className="font-bold">{name}</p>
            <p className="text-muted-foreground">{description}</p>
        </TooltipContent>
    </Tooltip>
);


export function ActionPanel({
  open,
  onOpenChange,
  token,
  character,
  enemy,
  actions,
  container,
  isInCombat,
  combatState,
  onUseAction,
  onDash,
  onAttack,
  onDodge,
}: ActionPanelProps) {

  const data = character || enemy;
  if (!token || !data) {
    return null;
  }
  
  const isPlayer = !!character;
  const health = token.hp ?? (isPlayer ? character.hp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
  const maxHealth = token.maxHp ?? (isPlayer ? character.maxHp : (enemy ? parseInt(enemy.hp.split(' ')[0]) : undefined));
  const healthPercent = (health !== undefined && maxHealth) ? (health / maxHealth) * 100 : 100;
  
  const ac = isPlayer ? character.ac : (enemy ? parseInt(enemy.ac) : 'N/A');
  const speed = isPlayer ? '30 ft.' : enemy?.speed; // Assuming base speed for players

  const baseCombatActions = [
      { name: 'Attack', description: 'Make a melee or ranged attack.', type: 'action', action: () => { onAttack?.(); onOpenChange(false); } },
      { name: 'Dash', description: 'Double your movement speed for the turn.', type: 'action', action: onDash },
      { name: 'Disengage', description: 'Move without provoking opportunity attacks.', type: 'action', action: () => onUseAction?.('action') },
      { name: 'Dodge', description: 'Focus on avoiding attacks.', type: 'action', action: onDodge },
  ];

  let availableActions: { name: string; description: string; type: string; action: (() => void) | undefined; }[] = [];

  if (isPlayer) {
    const customActions = actions.map(a => ({ 
        name: a.name, 
        description: a.description, 
        type: a.type.toLowerCase().includes('bonus') ? 'bonus' : 'action',
        action: () => onUseAction?.(a.type.toLowerCase().includes('bonus') ? 'bonus' : 'action')
    }));
    const useItemAction = { name: 'Use an Item', description: 'Interact with an object or item.', type: 'action', action: () => onUseAction?.('action') };
    availableActions = [...baseCombatActions, useItemAction, ...customActions];
  } else { // Is an enemy
    const monsterSpecificActions = enemy?.action?.map(action => ({
      name: action.name,
      description: action.text,
      type: 'action', // Assume all monster actions are 'action' for now
      action: () => { onAttack?.(); onOpenChange(false); },
    })) || [];
    availableActions = [...baseCombatActions, ...monsterSpecificActions];
  }


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[350px] sm:w-[400px]"
        container={container}
        showOverlay={!isInCombat || !open}
      >
          <TooltipProvider>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                      <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl font-headline">{token.name}</SheetTitle>
                    <SheetDescription>
                      {isPlayer ? `${character.race} ${character.className}` : `${enemy?.type}`}
                    </SheetDescription>
                  </div>
              </div>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Health</span>
                        <span>{health} / {maxHealth}</span>
                    </div>
                    <Progress value={healthPercent} className={isPlayer ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <StatDisplay icon={<Shield />} label="Armor Class" value={ac || 'N/A'} />
                    <StatDisplay icon={<Swords />} label="Initiative" value={isPlayer && character.stats ? `+${Math.floor((character.stats.dex - 10) / 2)}` : 'N/A'} />
                    <StatDisplay icon={<Footprints />} label="Speed" value={speed || 'N/A'} />
                </div>
                
                {isInCombat && combatState && (
                    <>
                        <Separator />
                        <div className="grid grid-cols-3 gap-2">
                            <StatDisplay icon={<Footprints />} label="Movement" value={`${combatState.movementRemaining}ft`} />
                            <StatDisplay icon={combatState.hasAction ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-destructive" />} label="Action" value={combatState.hasAction ? 'Ready' : 'Used'} />
                            <StatDisplay icon={combatState.hasBonusAction ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-destructive" />} label="Bonus Action" value={combatState.hasBonusAction ? 'Ready' : 'Used'} />
                        </div>
                    </>
                )}

                <Separator />

                <div className="space-y-2">
                    <h4 className="font-semibold">Actions</h4>
                    <div className="max-h-[calc(100vh-400px)] overflow-y-auto space-y-2 pr-2">
                      {availableActions.map((action, index) => {
                          const isDisabled = isInCombat && combatState && (
                              (action.type === 'action' && !combatState.hasAction) ||
                              (action.type === 'bonus' && !combatState.hasBonusAction)
                          );
                          return (
                              <ActionButton 
                                key={`${action.name}-${index}`} 
                                name={action.name} 
                                description={action.description} 
                                disabled={isDisabled}
                                onClick={() => {
                                    if (action.action) {
                                        action.action();
                                    }
                                }}
                              />
                          );
                      })}
                    </div>
                </div>
            </div>
          </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}
